from pathlib import Path
import re
from lxml import etree
from picosvg.svg import SVG

BASE = Path(__file__).resolve().parent.parent
INPUT = BASE / 'svg' / 'input'
OUTPUT = BASE / 'svg' / 'output'
SVG_NS = 'http://www.w3.org/2000/svg'


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = value.replace('_', '-')
    value = re.sub(r'[^a-z0-9]+', '-', value)
    value = re.sub(r'-{2,}', '-', value).strip('-')
    return value


def output_stem_from_input(input_path: Path) -> str:
    name_match = re.search(r'Name=([^,]+)', input_path.stem)
    color_match = re.search(r'Color=([^,]+)', input_path.stem)
    size_match = re.search(r'Size=([^,]+)', input_path.stem)

    parts = []
    if name_match:
        parts.append(slugify(name_match.group(1)))
    if color_match:
        parts.append(slugify(color_match.group(1)))
    if size_match:
        parts.append(slugify(size_match.group(1)))

    if parts:
        return '-'.join(part for part in parts if part)

    return slugify(input_path.stem)


def remove_mask_elements(svg_content: str) -> str:
    parser = etree.XMLParser(remove_blank_text=True)
    root = etree.fromstring(svg_content.encode('utf-8'), parser)
    etree.strip_elements(root, f'{{{SVG_NS}}}mask', with_tail=False)

    ns = f'{{{SVG_NS}}}'
    for defs in root.findall(f'.//{ns}defs'):
        if len(defs) == 0 and not (defs.text or '').strip():
            parent = defs.getparent()
            if parent is not None:
                parent.remove(defs)

    return etree.tostring(root, encoding='unicode', pretty_print=True)


def cleanup_previous_output(output_path: Path) -> None:
    target_stem = output_path.stem.lower()
    for existing in OUTPUT.glob('*.svg'):
        if existing.stem.lower() == target_stem and existing.name != output_path.name:
            existing.unlink()


def convert_svg(input_path: Path, output_path: Path) -> None:
    svg_content = input_path.read_text(encoding='utf-8')
    svg_content = remove_mask_elements(svg_content)
    svg = SVG.fromstring(svg_content)
    simplified_svg = svg.topicosvg()
    cleanup_previous_output(output_path)
    output_path.write_text(simplified_svg.tostring(), encoding='utf-8')
    print(f'Converted {input_path.name} -> {output_path.name}')


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for svg_path in INPUT.glob('*.svg'):
        output_name = f"{output_stem_from_input(svg_path)}.svg"
        convert_svg(svg_path, OUTPUT / output_name)


if __name__ == '__main__':
    main()

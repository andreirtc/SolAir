"""Make clean Arduino IDE sketches from the authoritative PlatformIO source.

Never copy private configuration or entry.cpp (which would duplicate setup/loop).
Run again after changing shared firmware source; existing private config is retained.
"""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parents[1]
source = root / 'firmware/solair-cpe'
output = root / 'firmware/arduino-ide'
headers = ('alarm_output.h', 'command_text.h', 'remote_control.h', 'pins.h', 'protocol.h', 'imu6500.h', 'acs_adc.h', 'acs_ads_input.h', 'ads_verified.h', 'modules.h', 'security_policy.h', 'measurement_policy.h', 'lte_https.h', 'lte_recovery.h', 'lte_destination.h', 'lte_ppp.h', 'lte_ppp_policy.h', 'diagnostic.h', 'engine.h', 'config.example.h')
sketches = [(p.parent.name, p) for p in sorted((source / 'tests').glob('*/*.ino'))]
sketches.append(('solair_cpe', source / 'solair_cpe.ino'))
inventory = []
for name, sketch in sketches:
    folder = output / name
    folder.mkdir(parents=True, exist_ok=True)
    text = sketch.read_text(encoding='utf-8-sig')
    text = text.replace('../../diagnostic.h', 'diagnostic.h').replace('../../engine.h', 'engine.h').replace('../../pins.h', 'pins.h')
    (folder / (name + '.ino')).write_text(text, encoding='utf-8')
    for header in headers:
        (folder / header).write_bytes((source / header).read_bytes())
    assert not (folder / 'entry.cpp').exists(), 'Remove duplicate wrapper before using IDE'
    for header in headers:
        assert (folder / header).read_bytes() == (source / header).read_bytes()
    inventory.append({'sketch': name, 'source': str(sketch.relative_to(root)),
                      'headers_sha256': {h: hashlib.sha256((folder / h).read_bytes()).hexdigest() for h in headers}})
(output / 'source-manifest.json').write_text(json.dumps(inventory, indent=2), encoding='utf-8')
print(f'PASS: {len(sketches)} Arduino IDE folders packaged; shared headers identical; no private config copied.')

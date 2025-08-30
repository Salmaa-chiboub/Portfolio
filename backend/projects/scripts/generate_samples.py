# Generates two small sample JPEG files used by test_projects_api.py
import base64
from pathlib import Path

# 1x1 JPEG base64
b64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAECA//EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAEH/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A/9k='
img = base64.b64decode(b64)
out = Path(__file__).parent
(out / 'sample1.jpg').write_bytes(img)
(out / 'sample2.jpg').write_bytes(img)
print('Wrote sample1.jpg and sample2.jpg')

"""
Spike script: probe Mars Trek WMTS endpoints, USGS, and PDS endpoints for Jezero Crater AOI.
AOI: Bounding box [77.40, 18.40, 77.48, 18.47] East/North
"""
import requests
import json
import time

def test_url(url, description):
    print(f"\n--- Testing: {description} ---")
    print(f"URL: {url}")
    try:
        r = requests.head(url, timeout=10, allow_redirects=True)
        print(f"HEAD Status: {r.status_code}")
        if r.status_code == 405 or r.status_code >= 400:
            # Try GET with range or small limit
            r = requests.get(url, headers={'Range': 'bytes=0-1024'}, timeout=10)
            print(f"GET Status: {r.status_code}, Content-Type: {r.headers.get('content-type')}")
        else:
            print(f"Content-Type: {r.headers.get('content-type')}, Content-Length: {r.headers.get('content-length')}")
        return r.status_code < 400
    except Exception as e:
        print(f"Error: {e}")
        return False

endpoints = [
    # Mars Trek Capabilities / Tile endpoints
    ("https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/WMTSCapabilities.xml", "Mars Trek MOLA WMTS Capabilities"),
    ("https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml", "Mars Trek Viking MDIM2.1 WMTS Capabilities"),
    ("https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0//default/default028mm/0/0/0.png", "Mars Trek MOLA Sample Tile"),
    # Mars 2020 Raw Image JSON Feed (PDS / NASA Mars 2020 API)
    ("https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=5&page=0", "Mars 2020 Raw Images API"),
    # Perseverance MEDA weather feed / Mars Weather API
    ("https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json", "NASA Mars Weather Feed (MSL/M2020)"),
    # USGS Astrogeology WMS / GeoJSON
    ("https://astrogeology.usgs.gov/search/map/Mars/Mars2020/JEZ_hirise_soc_006_orthoanddtm", "USGS Jezero HiRISE DTM page"),
]

results = {}
for url, desc in endpoints:
    results[desc] = test_url(url, desc)

print("\n=== SUMMARY OF SPIKE RESULTS ===")
for desc, ok in results.items():
    print(f"[{'OK' if ok else 'FAIL'}] {desc}")


#!/usr/bin/env python3
"""从 ECDICT stardict.csv 提取一词多义数据，更新 vocab_words 的 meaning 字段。
多义项用 **僻义** 标粗，第一义项为常用义。
用法: python3 scripts/enrich-meanings.py
"""

import csv
import json
import urllib.request
import urllib.error
import re
import sys
import time

SUPABASE_URL = 'https://kcgkrgalxgparkryzbhj.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZ2tyZ2FseGdwYXJrcnl6YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODUsImV4cCI6MjA5NTcxOTc4NX0.CP_FsR87K76MN42NGXXPfZAuMcMp_4A80833KBgsyMQ'

def patch_word(word_id, data):
    url = f"{SUPABASE_URL}/rest/v1/vocab_words?id=eq.{word_id}"
    req = urllib.request.Request(url, method='PATCH')
    req.add_header('apikey', ANON_KEY)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Prefer', 'return=minimal')
    body = json.dumps(data).encode('utf-8')
    for attempt in range(3):
        try:
            urllib.request.urlopen(req, data=body, timeout=10)
            return True
        except Exception as e:
            if attempt == 2:
                print(f"  Patch error for {word_id}: {e}")
                return False
            time.sleep(1)

def clean_pos_prefix(text):
    """Remove leading POS abbreviations like 'vt.', 'n.', 'a.', 'adv.', etc."""
    text = text.strip()
    # Remove leading POS: vt. | vi. | n. | adj. | adv. | prep. | a. | v. | art. | conj. | int. | pron. | num.
    text = re.sub(r'^[a-z]+\.\s+', '', text)
    # Also handle [医], [经], [网络] etc. at the beginning
    return text.strip()

def parse_translation(raw):
    """Parse ECDICT translation into formatted string with 熟词僻义 markers."""
    if not raw:
        return None

    lines = raw.replace('\\n', '\n').split('\n')
    lines = [l.strip() for l in lines if l.strip()]

    if len(lines) <= 1:
        # Only one line but might have rich content - still use it
        cleaned = clean_pos_prefix(lines[0])
        return cleaned if len(cleaned) > 0 else None

    # Clean and deduplicate
    parts = []
    seen = set()
    for line in lines:
        cleaned = clean_pos_prefix(line)
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            parts.append(cleaned)

    if len(parts) <= 1:
        return parts[0] if parts else None

    # Format: 常用义 — **僻义1** — **僻义2**
    main = parts[0]
    extras = parts[1:4]  # Max 3 extra meanings

    result = main
    for extra in extras:
        result += f'；**{extra}**'

    return result

def main():
    # Step 1: Get all our words
    print("Fetching our words from Supabase...")
    all_words = {}
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/vocab_words?select=id,word,meaning,phonetic&limit=1000&offset={offset}"
        req = urllib.request.Request(url)
        req.add_header('apikey', ANON_KEY)
        resp = json.loads(urllib.request.urlopen(req, timeout=30).read())
        if not resp:
            break
        for w in resp:
            # Skip words that already have bold markers
            if '**' not in (w.get('meaning') or ''):
                all_words[w['word'].lower()] = w
        offset += 1000
        print(f"  fetched {len(all_words)} words needing enrichment...")

    print(f"Words needing enrichment: {len(all_words)}")

    # Step 2: Parse stardict.csv
    print("Parsing stardict.csv...")
    matched = 0
    updated = 0
    total = 0

    with open('/tmp/stardict/stardict.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            if total % 200000 == 0:
                print(f"  scanned {total} rows, matched {matched}, updated {updated}")

            word = row.get('word', '').lower().strip()
            if word not in all_words:
                continue

            matched += 1
            translation = row.get('translation', '')
            enriched = parse_translation(translation)

            if not enriched:
                continue

            w = all_words[word]
            data = {'meaning': enriched}

            # Also fill phonetic if missing
            if not w.get('phonetic'):
                ph = row.get('phonetic', '').strip()
                if ph and len(ph) < 80:
                    data['phonetic'] = ph

            if patch_word(w['id'], data):
                updated += 1
                del all_words[word]  # Don't process again

            if updated % 200 == 0:
                print(f"  updated {updated}/{matched} matches so far...")

    print(f"\nDone! Scanned {total} rows, matched {matched}, updated {updated} words with enriched meanings.")

if __name__ == '__main__':
    main()

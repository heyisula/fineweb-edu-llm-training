import re
import sys

# Ensure UTF-8 output if possible, otherwise ignore
if sys.stdout.encoding != 'utf-8':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def clean_text_old(text: str) -> str:
    patterns = [
        r'\[Reference:.*?\]',
        r'\|answered by\|.*?\|',
        r'\|date created\|.*?\|',
        r'\|last updated\|.*?\|',
        r'\|[Cc]omments\|.*',
        r'answered by:.*?(?=\n|$)',
        r'date created:.*?(?=\n|$)',
        r'last updated:.*?(?=\n|$)',
        r'\bComments:.*?(?=\n|$)',
        r'Source:.*?(?=\n|$)',
        r'Posted by:.*?(?=\n|$)',
        r'\d{1,2}/\d{1,2}/\d{2,4}',
    ]
    for pattern in patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s*\|\s*$', '', text)
    return text.strip()

def clean_text_new(text: str) -> str:
    patterns = [
        # --- Metadata Patterns (Improved for nesting) ---
        r'\[Reference:.*?\]\]?',
        r'\|answered by\|.*?\|',
        r'\|date created\|.*?\|',
        r'\|last updated\|.*?\|',
        r'\|[Cc]omments\|.*',
        r'answered by:.*?(?=\n|$)',
        r'date created:.*?(?=\n|$)',
        r'last updated:.*?(?=\n|$)',
        r'\bComments:.*?(?=\n|$)',
        r'Source:.*?(?=\n|$)',
        r'Posted by:.*?(?=\n|$)',
        r'\d{1,2}/\d{1,2}/\d{2,4}',
        
        # --- Author/Editor Variations ---
        r'\b(?:Author|Editor|Written by|By):.*?(?=\s{2,}|\n|$)', # Require 2+ spaces or newline after to avoid catching in-text "By"
        
        # --- PII & Contact Info ---
        r'[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}',
        r'\b(?:https?://|www\.)\S+',
        
        # --- Citation & Reference Noise ---
        r'\[\d+(?:,\s*\d+)*\]',
        r'\(\d{4}\)',
        
        # --- Legal/Copyright ---
        r'(?i)Copyright\s*(?:©|\(c\))?\s*\d{4}(?:\s*-\s*\d{4})?.*?(?=\s{2,}|\n|$)',
        r'(?i)All rights reserved\.?',
        
        # --- Navigation/Interface Residue ---
        r'\bHome\s*>\s*.*?(?=\.|\s{2,}|\n|$)', # Stop at period or multiple spaces
        r'\bShare this:.*?(?=\n|$)',
        
        # --- Residual HTML Tags ---
        r'<[^>]+>',
    ]
    
    # Pre-processing
    text = text.replace('\xa0', ' ').replace('\u200b', '')
    text = text.replace('<br>', ' ').replace('<br/>', ' ').replace('<br />', ' ')
    
    for pattern in patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Cleanup residue
    text = re.sub(r'\|[\-\s\|]+\|', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[\s|\\/]+$', '', text)
    
    return text.strip()

test_cases = [
    {
        "name": "Mixed Metadata & Pipes",
        "text": "Photosynthesis is good. |answered by|John| |date created|01/01/2021| [Reference:[1]]"
    },
    {
        "name": "URLs & Emails",
        "text": "Check our site http://edu-science.org or email prof@harvard.edu for details."
    },
    {
        "name": "Citation Noise",
        "text": "Recent studies [1, 42] show that plants breathe (2022)."
    },
    {
        "name": "Copyright & Breadcrumbs",
        "text": "Home > Biology > Plants. This text is about roots. Copyright © 2024 ScienceEdu. All rights reserved."
    },
    {
        "name": "Broken Table Residue",
        "text": "The results are: | --- | --- | --- | as shown below."
    },
    {
        "name": "HTML Tags & Unicode",
         "text": "Line one.<br>Line two. This is clean."
    }
]

print(f"{'TEST CASE':<30} | {'OLD CLEANING':<35} | {'NEW CLEANING'}")
print("-" * 120)
for case in test_cases:
    old = clean_text_old(case['text'])
    new = clean_text_new(case['text'])
    print(f"{case['name']:<30} | {old[:35]:<35} | {new}")

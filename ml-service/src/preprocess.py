import re
import math
from collections import Counter
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def calculate_entropy(text):
    if not text: return 0
    entropy = 0
    for x in Counter(text).values():
        p_x = float(x) / len(text)
        entropy -= p_x * math.log(p_x, 2)
    return entropy

def extract_url_features(url):
    parsed = urlparse(url)
    features = {}
    
    features['url_length'] = len(url)
    features['has_ip'] = 1 if re.search(r'\d+\.\d+\.\d+\.\d+', url) else 0
    features['has_at_symbol'] = 1 if '@' in url else 0
    features['num_hyphens'] = url.count('-')
    features['num_subdomains'] = len(parsed.netloc.split('.')) - 2 if len(parsed.netloc.split('.')) > 2 else 0
    
    features['url_entropy'] = calculate_entropy(url)
    features['num_digits'] = sum(c.isdigit() for c in url)
    features['num_parameters'] = len(parsed.query.split('&')) if parsed.query else 0
    
    sensitive_words = ['login', 'secure', 'account', 'update', 'bank', 'verify', 'webscr', 'signin']
    features['has_sensitive_words'] = 1 if any(word in url.lower() for word in sensitive_words) else 0
    
    return features

def extract_dom_features(html_path, base_url):
    features = {
        'has_password_field': 0, 'has_hidden_iframe': 0, 'suspicious_form_action': 0,
        'script_to_content_ratio': 0.0, 'external_link_ratio': 0.0, 
        'empty_links_ratio': 0.0, 'num_input_fields': 0
    }
    
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            
            inputs = soup.find_all('input')
            features['num_input_fields'] = len(inputs)
            if soup.find('input', type='password'):
                features['has_password_field'] = 1
                
            parsed_base = urlparse(base_url).netloc
            for form in soup.find_all('form'):
                action = form.get('action', '').lower()
                if action.startswith('http') and parsed_base not in action:
                    features['suspicious_form_action'] = 1
                    break

            for iframe in soup.find_all('iframe'):
                if iframe.get('style') and ('visibility:hidden' in iframe.get('style').lower() or 'display:none' in iframe.get('style').lower()):
                    features['has_hidden_iframe'] = 1
                    break
            
            text_length = len(soup.get_text())
            script_length = sum([len(script.string) for script in soup.find_all('script') if script.string])
            if text_length > 0:
                features['script_to_content_ratio'] = script_length / text_length
            
            a_tags = soup.find_all('a', href=True)
            total_links = len(a_tags)
            external_links = 0
            empty_links = 0
            
            for a in a_tags:
                href = a['href'].lower()
                if href.startswith('http') and parsed_base not in href:
                    external_links += 1
                elif href == '#' or href.startswith('javascript:'):
                    empty_links += 1
                    
            if total_links > 0:
                features['external_link_ratio'] = external_links / total_links
                features['empty_links_ratio'] = empty_links / total_links
                
    except Exception as e:
        pass 
        
    return features
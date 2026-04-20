import json
try:
    with open('lighthouse-report.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
        cats = d['categories']
        print(f"Metrics Overview:")
        print(f"Performance: {cats.get('performance', {}).get('score', 0)*100}%")
        print(f"Accessibility: {cats.get('accessibility', {}).get('score', 0)*100}%")
        print(f"Best Practices: {cats.get('best-practices', {}).get('score', 0)*100}%")
        print(f"SEO: {cats.get('seo', {}).get('score', 0)*100}%")
        
        print("\nOpportunities & Bottlenecks:")
        audits = d.get('audits', {})
        for k, v in audits.items():
            if v.get('score') is not None and v.get('score') < 0.9:
                print(f"- {v.get('title')}: {v.get('displayValue', '')}")
except Exception as e:
    print(f"Error: {e}")

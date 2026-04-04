import PyPDF2

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        return text

if __name__ == '__main__':
    pdf_path = r"C:\Users\asifk\Downloads\HMS_Landing_Page_Features.pdf"
    content = extract_text(pdf_path)
    with open('pdf_output_utf8.txt', 'w', encoding='utf-8') as f:
        f.write(content)

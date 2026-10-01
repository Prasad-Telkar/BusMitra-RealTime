import pdfplumber

def read_pdf():
    pdf_path = "../data/Routes-2026.pdf"
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            full_text += text + "\n"
        
        lines = full_text.split('\n')
        for i, line in enumerate(lines[:50]):
            print(f"{i}: {line}")
            
if __name__ == '__main__':
    read_pdf()

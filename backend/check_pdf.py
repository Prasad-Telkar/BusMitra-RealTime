import fitz # PyMuPDF
import sys

def check_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    
    print("Extracting first 1000 characters...")
    print(text[:1000])

if __name__ == "__main__":
    check_pdf("../data/Routes-2026.pdf")

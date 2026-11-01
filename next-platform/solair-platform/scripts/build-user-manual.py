from pathlib import Path
from html import escape
import json, shutil
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,KeepTogether,Table,TableStyle,Image
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'src/content/solair-user-manual.json').read_text(encoding='utf-8'))
OUT=ROOT/'output/pdf/SOLAIR-user-manual.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
FONTS=Path('C:/Windows/Fonts');pdfmetrics.registerFont(TTFont('Guide',str(FONTS/'segoeui.ttf')));pdfmetrics.registerFont(TTFont('GuideBold',str(FONTS/'segoeuib.ttf')))
BLUE=colors.HexColor('#1959B5');INK=colors.HexColor('#202B3A');MUTED=colors.HexColor('#536170');GOLD=colors.HexColor('#EFB142');LINE=colors.HexColor('#DCE0E4');PALE=colors.HexColor('#EAF0FB')
styles={
 'title':ParagraphStyle('Title',fontName='GuideBold',fontSize=35,leading=42,textColor=INK,spaceAfter=18),
 'subtitle':ParagraphStyle('Subtitle',fontName='Guide',fontSize=14,leading=21,textColor=MUTED,spaceAfter=18),
 'chapter':ParagraphStyle('Chapter',fontName='GuideBold',fontSize=25,leading=31,textColor=INK,spaceAfter=14),
 'summary':ParagraphStyle('Summary',fontName='Guide',fontSize=11,leading=17,textColor=MUTED,spaceAfter=20),
 'heading':ParagraphStyle('Heading',fontName='GuideBold',fontSize=11,leading=16,textColor=INK,spaceAfter=4),
 'body':ParagraphStyle('Body',fontName='Guide',fontSize=10.3,leading=15.4,textColor=INK,spaceAfter=12),
 'note':ParagraphStyle('Note',fontName='Guide',fontSize=9.4,leading=14,textColor=MUTED,spaceAfter=8),
 'number':ParagraphStyle('Number',fontName='GuideBold',fontSize=11,leading=16,textColor=BLUE),
 'toc':ParagraphStyle('Contents',fontName='Guide',fontSize=11,leading=17,textColor=BLUE,spaceAfter=9),
 'eyebrow':ParagraphStyle('Eyebrow',fontName='GuideBold',fontSize=10,leading=15,textColor=BLUE,spaceAfter=12)
}
def P(text,kind='body'):return Paragraph(escape(text),styles[kind])
def chrome(canvas,doc):
 w,h=A4;canvas.saveState();canvas.setFillColor(BLUE);canvas.rect(0,h-7,w,7,fill=1,stroke=0)
 canvas.setFont('Guide',8);canvas.setFillColor(MUTED);canvas.drawString(42,h-29,'SOLAIR | USER MANUAL');canvas.drawRightString(w-42,h-29,'VERSION '+data['version'])
 canvas.setStrokeColor(LINE);canvas.line(42,38,w-42,38);canvas.drawString(42,24,'Driver guide | '+data['updated']);canvas.drawRightString(w-42,24,f'{doc.page} / {len(data["sections"])+1}');canvas.restoreState()
story=[]
logo=ROOT/'public/solair-logo-transparent.png'
if logo.exists():story.extend([Image(str(logo),width=140,height=140*1007/1562,hAlign='LEFT'),Spacer(1,24)])
story.extend([P('YOUR EVERYDAY COMPANION','eyebrow'),P('SOLAIR<br/>User manual'.replace('<br/>',' '),'title'),P(data['subtitle'],'subtitle'),P(data['introduction']),Spacer(1,18),P('Inside this guide','heading')])
for index,section in enumerate(data['sections'],1):story.append(Paragraph(f'<link href="#chapter-{section["id"]}" color="#1959B5">{index:02d}  {escape(section["title"])}</link>',styles['toc']))
story.extend([Spacer(1,18),P('Quick start: sign in, check your TODA and assigned vehicle, then use the Home, Location, Energy, Alerts, Notifications and Settings tabs. Help and Registration are in the hamburger menu.','note')])
for index,section in enumerate(data['sections'],1):
 story.extend([PageBreak(),Paragraph(f'<a name="chapter-{section["id"]}"/>{index:02d}',styles['eyebrow']),P(section['title'],'chapter'),P(section['summary'],'summary')])
 for step_index,step in enumerate(section['steps'],1):
  content=[P(step['title'],'heading'),P(step['text'])]
  table=Table([[P(f'{step_index:02d}','number'),content]],colWidths=[30,A4[0]-114],hAlign='LEFT');table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]));story.append(KeepTogether([table]))
 story.append(Spacer(1,8))
 for note in section['notes']:
  text=Paragraph(f'<b>{escape(note["title"])}</b><br/>{escape(note["text"])}',styles['note'])
  box=Table([[text]],colWidths=[A4[0]-84]);box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),4)]));story.extend([KeepTogether([box]),Spacer(1,8)])
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=54,bottomMargin=53,title=data['title'],author='SOLAIR',subject='Driver account, location, energy, assistance and settings workflows')
doc.build(story,onFirstPage=chrome,onLaterPages=chrome)
reader=PdfReader(str(OUT));assert len(reader.pages)==len(data['sections'])+1,f'Unexpected page overflow: {len(reader.pages)}'
text='\n'.join(page.extract_text() or '' for page in reader.pages)
for section in data['sections']:assert section['title'] in text,section['title']
PUBLIC=ROOT/'public/downloads/SOLAIR-user-manual.pdf';PUBLIC.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(OUT,PUBLIC)
print(f'Created {len(reader.pages)}-page user manual; popup source and PDF use the same chapter content.')

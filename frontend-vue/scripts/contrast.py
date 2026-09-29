def L(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4 for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b):
    x,y=sorted([L(a),L(b)],reverse=True); return (x+.05)/(y+.05)
T={
'light':dict(b1='#FFFFFF',b2='#F5F4F2',text='#1C1B1A',muted='#5E5B57',primary='#F26A1B',pc='#1A1208',ot='#B8460A',sec='#3B3936',secc='#F5F4F2',neu='#1C1B1A',neuc='#F5F4F2',bs='#8A8580',
  st=dict(success=('#1F7A45','#FFFFFF'),error=('#B3261E','#FFFFFF'),warning=('#8A5A00','#FFFFFF'),info=('#2F5F8F','#FFFFFF'))),
'dark':dict(b1='#131211',b2='#1C1B19',text='#ECEAE6',muted='#A8A39C',primary='#FF8533',pc='#170D03',ot='#FF9A55',sec='#3B3936',secc='#ECEAE6',neu='#ECEAE6',neuc='#131211',bs='#7A756E',
  st=dict(success=('#4CC180','#0B1A11'),error=('#FF7B72','#1F0906'),warning=('#E8B03A','#1A1203'),info=('#78A9DC','#0A1622'))),
'contrast':dict(b1='#000000',b2='#0D0D0D',text='#FFFFFF',muted='#D6D6D6',primary='#FF8A2B',pc='#000000',ot='#FFA35C',sec='#FFFFFF',secc='#000000',neu='#FFFFFF',neuc='#000000',bs='#9A9A9A',
  st=dict(success=('#5FE39A','#000000'),error=('#FF8A80','#000000'),warning=('#FFD34D','#000000'),info=('#8CC4FF','#000000')))}
for n,t in T.items():
    print(n)
    for k,(a,b) in {'text/b1':(t['text'],t['b1']),'text/b2':(t['text'],t['b2']),'muted/b1':(t['muted'],t['b1']),'muted/b2':(t['muted'],t['b2']),'pc/primary':(t['pc'],t['primary']),'orange-text/b1':(t['ot'],t['b1']),'orange-text/b2':(t['ot'],t['b2']),'secc/sec':(t['secc'],t['sec']),'neuc/neu':(t['neuc'],t['neu']),'border/b1':(t['bs'],t['b1']),'border/b2':(t['bs'],t['b2']),'primary/b1(UI)':(t['primary'],t['b1'])}.items():
        print(f'  {k:16s}{cr(a,b):6.2f}')
    for s,(f,c) in t['st'].items():
        print(f'  {s:8s} fill/b1 {cr(f,t["b1"]):5.2f}  fill/b2 {cr(f,t["b2"]):5.2f}  content/fill {cr(c,f):5.2f}')

"""Generate replaceable concept GIFs and reduced-motion PNG posters (requires Pillow)."""
from pathlib import Path
from math import cos, sin, pi, atan2, sqrt
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / 'site' / 'assets'
SIZE = (640, 360)
SCALE = 2
INK = '#243731'
GREEN = '#377b51'
LIME = '#d5eb8d'
MUTED = '#78877c'
LINE = '#d7dfd5'
PAPER = '#f9fbf7'
font_path = '/System/Library/Fonts/Menlo.ttc'

def font(size):
    try:
        return ImageFont.truetype(font_path, size * SCALE)
    except OSError:
        return ImageFont.load_default(size=size * SCALE)

def base(number, title):
    image = Image.new('RGB', tuple(v*SCALE for v in SIZE), PAPER)
    draw = ImageDraw.Draw(image)
    for x in range(20, 640, 28):
        for y in range(20, 360, 28):
            draw.ellipse((x*SCALE,y*SCALE,(x+1)*SCALE,(y+1)*SCALE),fill=LINE)
    text(draw,(25,20),number,INK,15)
    text(draw,(85,20),title,MUTED,13)
    line(draw,[(24,48),(616,48)],LINE,1)
    return image,draw

def line(draw,points,color=INK,width=2):
    draw.line([(round(x*SCALE),round(y*SCALE)) for x,y in points],fill=color,width=width*SCALE)

def circle(draw,center,radius,fill,outline=INK,width=2):
    x,y=center
    draw.ellipse(tuple(round(v*SCALE) for v in (x-radius,y-radius,x+radius,y+radius)),fill=fill,outline=outline,width=width*SCALE)

def text(draw,point,label,color=INK,size=15):
    draw.text(tuple(round(v*SCALE) for v in point),label,fill=color,font=font(size))

def arrow(draw,start,end,color=GREEN,width=2):
    line(draw,[start,end],color,width)
    theta=atan2(end[1]-start[1],end[0]-start[0])
    for side in [-1,1]:
        q=(end[0]-10*cos(theta+side*.5),end[1]-10*sin(theta+side*.5))
        line(draw,[q,end],color,width)

# Fixed-step, one-dimensional mass/spring scene. Screen-positive y points down.
SPRING_DT = 1 / 240
SPRING_TOP = 239
SPRING_FLOOR = 307
BALL_RADIUS = 17
STAR_Y = 174

def simulate_spring():
    states, events = [], {'gravity_added': 1.3}
    y, velocity, gravity = 100.0, 0.0, 0.0
    was_contact = False
    max_compression = 0
    contacts = 0
    for tick in range(240 * 15):
        time = tick * SPRING_DT
        previous_velocity = velocity
        if time >= events['gravity_added']:
            gravity = 150.0
        if 'prompt' in events and time >= events['prompt'] + .45:
            gravity = -150.0
            events.setdefault('reversed', time)
        compression = max(0.0, y + BALL_RADIUS - SPRING_TOP)
        acceleration = gravity
        if compression:
            acceleration -= 40 * compression + .35 * velocity
        velocity += acceleration * SPRING_DT
        y += velocity * SPRING_DT
        compression = max(0.0, y + BALL_RADIUS - SPRING_TOP)
        max_compression = max(max_compression, compression)
        contact = compression > 0
        if contact and not was_contact:
            contacts += 1
            events.setdefault('contact', time)
        if was_contact and not contact and velocity < 0:
            events.setdefault('release', time)
        if 'release' in events and previous_velocity < 0 <= velocity:
            events.setdefault('apex', time)
        if 'apex' in events and velocity > 35:
            events.setdefault('prompt', time)
        if 'reversed' in events and previous_velocity > 0 >= velocity:
            events.setdefault('turn_up', time)
        if y + BALL_RADIUS >= STAR_Y - 12 and 'collected' not in events:
            events['collected'] = time
        if 'turn_up' in events and y + BALL_RADIUS < 70:
            events.setdefault('exit', time)
        states.append({'time': time, 'y': y, 'velocity': velocity, 'gravity': gravity,
                       'compression': compression})
        was_contact = contact
        if 'exit' in events:
            break
    order = ['gravity_added', 'collected', 'contact', 'release', 'apex', 'prompt', 'reversed', 'turn_up', 'exit']
    assert all(name in events for name in order), events
    assert all(events[a] < events[b] for a, b in zip(order, order[1:])), events
    assert 18 < max_compression < SPRING_FLOOR - SPRING_TOP - 15
    assert contacts == 1, 'Reverse gravity must turn the ball before a second spring collision'
    flip = states[round(events['reversed'] / SPRING_DT)]
    assert flip['velocity'] > 0, 'The ball must still be falling when gravity flips'
    turn = states[round(events['turn_up'] / SPRING_DT)]
    assert turn['y'] > flip['y'], 'Upward gravity must first decelerate the falling ball'
    print('Spring events:', {k: round(events[k], 2) for k in order})
    print('Maximum compression:', round(max_compression, 2), 'px; spring contacts:', contacts)
    return states, events

SPRING_STATES, SPRING_EVENTS = simulate_spring()
SPRING_LOOP_SECONDS = SPRING_EVENTS['exit'] + 1.25

def star(draw, center, radius=13, color='#c49d43', inner=None):
    points = []
    for index in range(10):
        angle = -pi / 2 + index * pi / 5
        length = radius if index % 2 == 0 else radius * .45
        points.append(((center[0]+cos(angle)*length)*SCALE,
                       (center[1]+sin(angle)*length)*SCALE))
    draw.polygon(points, fill=inner or '#f0dca0', outline=color, width=SCALE)

def spring_frame(t):
    time = t * SPRING_LOOP_SECONDS
    end = SPRING_EVENTS['exit']
    fade = 1.0
    if time > end + .9:
        # Fade the reset in rather than teleporting the ball across the scene.
        fade = min(1.0, (time - end - .9) / .35)
        time = 0
    elif time > end + .55:
        fade = 1 - (time - end - .55) / .35
    state = SPRING_STATES[min(round(time / SPRING_DT), len(SPRING_STATES)-1)]
    y, compression = state['y'], state['compression']
    image, draw = base('02', 'REWRITE THE FALL')
    line(draw, [(302,73),(302,307)], LINE, 1)
    # A vertical spring mounted to the floor; its top follows compression.
    top = SPRING_TOP + compression
    line(draw,[(129,SPRING_FLOOR),(217,SPRING_FLOOR)],INK,4)
    for x in range(130,218,12):
        line(draw,[(x,SPRING_FLOOR+8),(x+9,SPRING_FLOOR)],MUTED,1)
    points=[(173,SPRING_FLOOR),(173,SPRING_FLOOR-7)]
    for index in range(13):
        points.append((173+(13 if index%2 else -13),
                       SPRING_FLOOR-7-(SPRING_FLOOR-top-14)*index/12))
    points += [(173,top+7),(173,top)]
    line(draw,points,GREEN,3)
    line(draw,[(153,top),(193,top)],INK,3)
    # Keep the ball and collection effects inside the experiment's viewport.
    scene = Image.new('RGBA', image.size, (0,0,0,0))
    scene_draw = ImageDraw.Draw(scene)
    collected = time >= SPRING_EVENTS['collected']
    if not collected:
        star(scene_draw,(173,STAR_Y))
    elif time - SPRING_EVENTS['collected'] < .4:
        progress = (time-SPRING_EVENTS['collected'])/.4
        for index in range(8):
            angle = index*pi/4
            start=(173+cos(angle)*(12+progress*12),STAR_Y+sin(angle)*(12+progress*12))
            finish=(173+cos(angle)*(18+progress*16),STAR_Y+sin(angle)*(18+progress*16))
            line(scene_draw,[start,finish],'#c49d43',2)
    if time >= SPRING_EVENTS.get('reversed', 99):
        arrow(scene_draw,(231,220),(231,140),GREEN,2)
    elif time >= SPRING_EVENTS['gravity_added']:
        arrow(scene_draw,(231,131),(231,210),GREEN,2)
    else:
        line(scene_draw,[(141,100),(148,100)],MUTED,1)
        line(scene_draw,[(198,100),(205,100)],MUTED,1)
    if y+BALL_RADIUS > 70:
        circle(scene_draw,(173,y),BALL_RADIUS,LIME,INK,2)
        circle(scene_draw,(168,y-5),4,'#f1f8d8','#f1f8d8',1)
    bounds = (24*SCALE,70*SCALE,288*SCALE,306*SCALE)
    image.paste(scene.crop(bounds), bounds[:2], scene.crop(bounds))
    draw = ImageDraw.Draw(image)
    # Commands stay on the right; g changes without teleporting the ball.
    if time < SPRING_EVENTS['gravity_added']:
        label, command, detail = 'INITIAL STATE', 'Suspended.', 'No gravity. No support.'
    elif time < SPRING_EVENTS['contact']:
        label, command, detail = 'YOUR FIRST RULE', 'add gravity', 'The ball starts to fall.'
    elif time < SPRING_EVENTS['prompt']:
        label, command, detail = 'ACTIVE RULE', 'add gravity', 'Gravity pulls downward.'
    else:
        label, command = 'YOUR NEXT RULE', 'reverse the gravity'
        if time < SPRING_EVENTS['reversed']:
            detail = 'Change the rule, not the ball.'
        elif time < SPRING_EVENTS['turn_up']:
            detail = 'Slow down. Then turn around.'
        else:
            detail = 'Now gravity pulls upward.'
    text(draw,(326,83),label,MUTED,12)
    text(draw,(326,119),command,INK,23)
    text(draw,(326,166),detail,MUTED,12)
    g_label = 'g = 0'
    if time >= SPRING_EVENTS['reversed']: g_label = 'g = -9.8'
    elif time >= SPRING_EVENTS['gravity_added']: g_label = 'g = +9.8'
    text(draw,(326,208),g_label,GREEN,20)
    line(draw,[(326,247),(603,247)],LINE,1)
    if collected:
        star(draw,(335,277),8,inner='#e5eddf',color=GREEN)
        text(draw,(355,265),'STAR COLLECTED',GREEN,12)
    else:
        star(draw,(335,277),8)
        text(draw,(355,265),'COLLECT THE STAR',MUTED,12)
    text(draw,(25,329),'CHANGE THE RULE. CHANGE THE OUTCOME.',MUTED,12)
    if fade < 1:
        image = Image.blend(Image.new('RGB',image.size,PAPER),image,max(0,fade))
    return image


def orbit_frame(t):
    image,draw=base('03','CUSTOM GRAVITY FIELD')
    a,e=160,.5
    b=a*sqrt(1-e*e)
    cx,cy=335,190
    # Kepler's equation gives the elliptical orbit its changing speed.
    m=2*pi*t
    eccentric=m
    for _ in range(8):
        eccentric-=(eccentric-e*sin(eccentric)-m)/(1-e*cos(eccentric))
    bx,by=cx+a*cos(eccentric),cy+b*sin(eccentric)
    ax,ay=cx-a*e,cy
    points=[(cx+a*cos(2*pi*i/120),cy+b*sin(2*pi*i/120)) for i in range(121)]
    line(draw,points,LINE,2)
    dx,dy=ax-bx,ay-by
    distance=sqrt(dx*dx+dy*dy)
    if distance>74:
        arrow(draw,(bx+dx/distance*24,by+dy/distance*24),(ax-dx/distance*42,ay-dy/distance*42),GREEN,2)
    circle(draw,(ax,ay),29,INK,INK)
    text(draw,(ax-7,ay-13),'A',PAPER,21)
    circle(draw,(bx,by),16,LIME,INK,2)
    text(draw,(bx+23,by-14),'B',INK,19)
    text(draw,(25,323),'ONE SOURCE. A NEW WAY TO MOVE.',MUTED,12)
    return image

def save(name,renderer,frame_count=72,duration=60):
    frames=[renderer(i/frame_count).resize(SIZE,Image.Resampling.LANCZOS) for i in range(frame_count)]
    # One shared palette avoids flashing between frames.
    swatches=Image.new('RGB',(640,360*5),PAPER)
    for row in range(5): swatches.paste(frames[row*len(frames)//5],(0,row*360))
    palette=swatches.quantize(colors=64)
    converted=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    converted[0].save(OUT/(name+'.gif'),save_all=True,append_images=converted[1:],duration=duration,loop=0,optimize=True,disposal=2)
    frames[0].save(OUT/(name+'-poster.png'),optimize=True)
    with Image.open(OUT/(name+'.gif')) as gif:
        assert gif.n_frames > 1 and gif.info['loop']==0
        for index in range(gif.n_frames): gif.seek(index); gif.load()
    print(name, frame_count, 'source frames verified,', (OUT/(name+'.gif')).stat().st_size,'bytes')

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('--only',choices=['spring','orbit'])
    args=parser.parse_args()
    if args.only in [None,'spring']:
        save('gravity-spring-rules',spring_frame,round(SPRING_LOOP_SECONDS/.06),60)
    if args.only in [None,'orbit']:
        save('orbit-experiment',orbit_frame)

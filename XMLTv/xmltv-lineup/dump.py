import sys
import re
import xmltv
import datetime
import traceback
from requests_html import HTMLSession

CHANNELS = [
    ('TV Sergipe', '1245'),
    ('SBT Aracaju', '177'),
    ('TV Aperipê', '1244'),
    ('Band', '89'),
    ('TV Atalaia', '129')
]

session = HTMLSession()
writer_class = xmltv.Writer()

for channel in CHANNELS:
    print("Scrapping {}".format(channel[0]))

    r = session.get("http://lineup.tv.br/gdc.php?idCanal={}".format(channel[1]))
    if r.status_code == 200:
        url_grade = None
        channel_icon = None

        for img in r.html.find('img'):
            if 'src' in img.attrs:
                if img.attrs['src'].startswith('http://www.lineup.tv.br/canais'):
                    channel_icon = img.attrs['src']
                    break

        for link in r.html.find("a"):
            if 'href' in link.attrs:
                if link.attrs['href'].startswith("gdc.php?Guia="):
                    if link.text == 'Ver Grade Completa':
                        url_grade = link.attrs['href']
                        break

        if url_grade:
            r = session.get("http://lineup.tv.br/{}".format(url_grade))
            if r.status_code == 200:
                #We found the channel, lets add the data
                writer_class.addChannel({
                    'display-name': [((channel[0]), u'pt')],
                    'id': (channel[1]),
                    'icon': [{'src': (channel_icon if channel_icon else '')}]
                })

                for td in r.html.find('td[valign="top"]'):
                    if td.find('p', first = True):
                        paragraph = td.find('p', first = True)
                        if paragraph.text == "Hoje" or paragraph.text == "Amanhã" or re.match(".*\/.*\/.*", paragraph.text):
                            if paragraph.text == "Hoje":
                                date = datetime.datetime.today().replace(second = 0)
                            elif paragraph.text == "Amanhã":
                                date = datetime.datetime.today().replace(second = 0) + datetime.timedelta(days = 1)
                            else:
                                date = datetime.datetime.strptime(paragraph.text, "%d/%m/%Y")

                            print("Parsing data from {}".format(date))

                            div = td.find('div', first = True)
                            if div:
                                print("Starting to parse DIV")
                                div = div.lxml
                                # Format of programs are: <img><font>Time</font><a>Name</a><i>Categories</i><small>show info</small>
                                show_info = {}

                                for child in div[0] if len(div) == 1 else div:
                                    if child.tag == "img":
                                        if len(show_info) > 0:
                                            try:
                                                start_time = date.replace(hour = int(show_info['start_time'].split(":")[0]), minute = int(show_info['start_time'].split(":")[1]))
                                                end_time = date.replace(hour = int(show_info['end_time'].split(":")[0]), minute = int(show_info['end_time'].split(":")[1]))
                                                duration = "{}".format((end_time - start_time).total_seconds() / 60)

                                                writer_class.addProgramme({
                                                    'title': [(str(show_info['name']), u'')],
                                                    'length': {'units': u'minutes', 'length': str(duration)},
                                                    'start': str(start_time.strftime('%Y%m%d%H%M%S -0300')),
                                                    'stop': str(end_time.strftime('%Y%m%d%H%M%S -0300')),
                                                    'channel': str(channel[1]),
                                                    'desc': [(show_info['info'], u'') if 'info' in show_info else ('', u'')],
                                                    'category': [(category, u'') for category in show_info['categories']] if 'categories' in show_info else []
                                                })
                                            except Exception as e:
                                                traceback.print_exc(file=sys.stdout)

                                        show_info = {}
                                    elif child.tag == "font":
                                        show_time = child.text.split(" as ")
                                        show_info['start_time'] = show_time[0]
                                        show_info['end_time'] = show_time[1]
                                    elif child.tag == "a":
                                        show_info['name'] = child.text.strip()
                                    elif child.tag == "i":
                                        show_info['categories'] = [category.strip() for category in child.text.split("-")]
                                    elif child.tag == "small":
                                        show_info['info'] = child.text.strip()


writer_class.write("guide.xml")

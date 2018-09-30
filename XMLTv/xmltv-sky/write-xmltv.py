import json
import xmltv
import sys
import os, os.path
import subprocess
from dateutil.parser import parse

channelNumber = 1
writerClass = xmltv.Writer()

if os.path.exists('dump.json'):
    os.unlink('dump.json')

#Let's start

FNULL = open(os.devnull, 'w')

while True:
    if subprocess.call(['xvfb-run', 'phantomjs', 'dump.js', str(channelNumber)], stdout = FNULL, stderr=subprocess.STDOUT) == 0:
        if os.path.exists('dump.json'):
            with open('dump.json') as dumpfp:
                #try:
                    jsonDump = json.load(dumpfp)
                    if 'content' in jsonDump:
                        if len(jsonDump['content']) > 0 and jsonDump['content'][len(jsonDump['content']) - 1]['id'] != channelNumber:
                            for channelData in jsonDump['content']:
                                writerClass.addChannel({
                                    'display-name': [(unicode(channelData['title']), u'pt')],
                                    'id': unicode(channelData['id']),
                                    'icon': [{'src': unicode(channelData['imageUrl'])}]
                                })

                                for programData in channelData['schedules']:
                                    try:
                                        writerClass.addProgramme({
                                            'title': [(unicode(programData['title']), u'')],
                                            'length': {'units': u'minutes', 'length': unicode(programData['duration'])},
                                            'start': unicode(parse(programData['startDate']).strftime('%Y%m%d%H%M%S %Z')),
                                            'stop': unicode(parse(programData['endDate']).strftime('%Y%m%d%H%M%S %Z')),
                                            'channel': unicode(channelData['id'])
                                        })
                                    except:
                                        pass

                                channelNumber = channelData['id']
                        else:
                            break
                    else:
                        break
                #except Exception as e:
                #    break
        else:
            break
    else:
        break

writerClass.write(sys.stdout)


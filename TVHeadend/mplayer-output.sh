#!/bin/bash

#This file can be used as a pipe script to TVHEADEND, as we know, IPTV is not reliable,
#and so, we need some buffers, as I didnt find any buffer options at ffmpeg, nor avconv, I used mplayer dumpstream.
#modify it as you need.


#Use a trap to kill mplayer and remove the fifo
trap 'kill -9 $PID && rm -f /home/hts/dump.stream 2>/dev/null' EXIT

#Remove the fifo to ensure
rm -f /home/hts/dump.stream

#Create a fifo to dump the stream
mkfifo /home/hts/dump.stream

#Open mplayer, with a 2048 cache, ignore ipv6, and be really quiet
mplayer -prefer-ipv4 -cache 2048 -really-quiet "$1" -dumpstream -dumpfile /home/hts/dump.stream &
PID=$!

#Run avconv, encoding the stream to H264 with AAC and MPEGTS, this makes sure it will be played at tvheadend
avconv -v error -fflags +genpts -i /home/hts/dump.stream -vbsf h264_mp4toannexb -vcodec libx264 -acodec aac -f mpegts pipe:1


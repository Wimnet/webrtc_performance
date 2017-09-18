#!/bin/bash
cp parse_xml.py trial1/monitor
cp parse_xml.py trial1/receiver
cp parse_xml.py trial1/sender

SENDER_IP="192.168.1.128"

cd trial1/monitor
sudo tshark -T pdml -r trial1.pcap -Y "ip.src == $SENDER_IP and udp and not stun and not dtls and not dns" > trial1_sr.xml
sudo tshark -T pdml -r trial1.pcap -Y "ip.dst == $SENDER_IP and udp and not stun and not dtls and not dns" > trial1_rs.xml
python parse_xml.py trial1_sr.xml radiotap.datarate 100 &
python parse_xml.py trial1_rs.xml radiotap.datarate 100 &

cd ../receiver
sudo tshark -T pdml -r trial1.pcap -Y "ip.src == $SENDER_IP and udp and not stun and not dtls and not dns" > trial1.xml
python parse_xml.py trial1.xml frame.time_delta 100 &
python parse_xml.py trial1.xml frame.cap_len 100 &
python parse_xml.py trial1.xml caplen 100 &
python parse_xml.py trial1.xml cdf 100 &

cd ../sender
sudo tshark -T pdml -r trial1.pcap -Y "ip.dst == $SENDER_IP and udp and not stun and not dtls and not dns" > trial1.xml
python parse_xml.py trial1.xml frame.time_delta 100 &
python parse_xml.py trial1.xml frame.cap_len 100 &
python parse_xml.py trial1.xml caplen 100 &
python parse_xml.py trial1.xml cdf 100 &
cd ../../
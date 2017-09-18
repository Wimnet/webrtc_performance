import sys
import numpy as np
import pandas as pd
import json


def main():
	input_file = sys.argv[1]
	print input_file
	with open(input_file) as json_data:
		callData = json.load(json_data)
		print 'call length: ' + str(len(callData['xAxis']))

		#data arrays
		totSentBw = np.array(callData['bw']['sent'])
		totRecvBw = np.array(callData['bw']['recv'])
		sentFps = np.array(map(float, callData['fps']['sent']))
		recvFps = np.array(map(float, callData['fps']['recv']))
		sentRes = np.array(map(float, callData['res']['sent']))
		recvRes = np.array(map(float, callData['res']['recv']))
		totPL = np.array(map(float, callData['pl']))
		totRTT = np.array(callData['rtt'])

		print ""
		print "--- Bandwidth --- "
		print "send (red): mean =[ " + str(round(np.mean(totSentBw), 3)) + " Kbps ]\tstd dev =[ " + str(round(np.std(totSentBw), 3)) + " Kbps ]"
		print "recv (blue): mean =[ " + str(round(np.mean(totRecvBw), 3)) + " Kbps ]\tstd dev =[ " + str(round(np.std(totRecvBw), 3)) + " Kbps ]"
		print ""
		print "--- Framerate ---"
		print "send (red): mean =[ " + str(round(np.mean(sentFps), 3)) + " fps ]\tstd dev =" + str(round(np.std(sentFps), 3)) + " fps ]"
		print "recv (blue): mean =[ " + str(round(np.mean(recvFps), 3)) + " fps ]\tstd dev=[ " + str(round(np.std(recvFps), 3)) + " fps ]"
		print ""
		print "--- FrameWidth ---"
		print "send (red): mean =[ " + str(round(np.mean(sentRes), 3)) + " px ]\tstd dev =[ " + str(round(np.std(sentRes), 3)) + " px ]"
		print "recv (blue): mean =[ " + str(round(np.mean(recvRes), 3)) + " px ]\tstd dev =[ " + str(round(np.std(recvRes), 3)) + " px ]"
		print ""
		print "--- Packet Loss ---"
		print "mean =[ " + str(round(np.mean(totPL), 3)) + "% ]\tstd dev =[ " + str(round(np.std(totPL), 3)) + "% ]"
		print ""
		print "--- Round Trip Time ---"
		print "mean =[ " + str(round(np.mean(totRTT), 3)) + " ms ]\tstd dev =[ " + str(round(np.std(totRTT), 3)) + " ms ]"
		

if __name__ == "__main__":
	main()
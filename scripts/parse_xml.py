import xml.etree.ElementTree as ET
import sys, os
import matplotlib.pyplot as plt
import numpy as np

axes = []
fig = plt.figure()
ax1 = fig.add_subplot(1, 1, 1)
axes.append(ax1)

x = []
y = []

if len(sys.argv) < 4 or len(sys.argv) > 5:
    print "You only entered an incorrect number of arguments, correct usages is: python parse_xml.py input_file token window_length extra_input_file"
    print "Some example tokens are: time_delta, data_rate, etc..."
    print "The extra_input_file is only required for repetitions.  The first input should be the monitor and the second should be the receiver, or sender, whichever you prefer"
try:
    input_file = sys.argv[1]
    print "Input File: " + input_file
    
    token = sys.argv[2]
    print "Token: " + token

    window_length = int(sys.argv[3])
    print "Window Length: " + str(window_length)

    if token == 'repetitions':
        extra_input_file = sys.argv[4]
    
    #    num_packets_average = int(sys.argv[3])
    #    print "Number of packets to average: " + str(num_packets_average)
    #    if token == "frame.cap_len":
    #        average_number = float(sys.argv[4])
    #        print "Average Number (time in milliseconds): " + str(average_number)
    repetitions = False
    if token == 'repetitions':
        repetitions = True
        token = 'frame.cap_len'
            
except:
    print "There was an error parsing the command line arguments"
    sys.exit(1)

print 'Parsing XML (this might take a while)...'

#tree = ET.parse(input_file)
#tree = ET.iterparse(input_file)
#for event, element in tree:
#    if element.name == 'frame.time_relative':
#        x.append(float(element.show))
#    elif element.name == token:
#        if token == 'data.data':
#            y.append(element.value[:8])
#        else:
#            y.append(float(element.show))

#for child in tree.getroot().iter():
if not repetitions:
    for event, child in ET.iterparse(input_file):
        if event == 'end':
            if 'name' in child.attrib.keys() and child.attrib['name'] == 'timestamp':
                x.append(float(child.attrib['value']))
            if ('name' in child.attrib.keys() and child.attrib['name'] == token) or (token == 'cdf' and 'name' in child.attrib.keys() and child.attrib['name'] == 'frame.time_delta'):
                if token == 'data.data':
                    y.append(child.attrib['value'][:8])
                else:
                    y.append(float(child.attrib['show']))
        child.clear()

    print 'Making the data nice...'
    min_time = 1000000000000
    for element in x:
        if element < min_time:
            min_time = element

    for i in range(0, len(x)):
        x[i] -= min_time


    if (not len(x) == len(y)):
        print 'There was an error in the xml data, aborting...'
        print ('Length X: ' + str(len(x)))
        print ('Length Y: ' + str(len(y)))
        #    sys.exit(1)
else:
    for event, child in ET.iterparse(input_file):
        if event == 'end':
            if 'name' in child.attrib.keys() and child.attrib['name'] == 'timestamp':
                x.append(float(child.attrib['value']))
        child.clear()
    for event, child in ET.iterparse(extra_input_file):
        if event == 'end':
            if 'name' in child.attrib.keys() and child.attrib['name'] == 'timestamp':
                y.append(float(child.attrib['value']))
        child.clear()

    min_time = 100000000000000
    for element in y:
        if element < min_time:
            min_time = element
            
    for i in range(0, len(y)):
        y[i] -= min_time

    min_time = 100000000000000
    for element in x:
        if element < min_time:
            min_time = element
            
    for i in range(0, len(x)):
        x[i] -= min_time




actual_x = []
actual_y = []

counter = 0
current_x_sum = 0.0
current_y_sum = 0.0

def average_array(array):
    summer = 0.0
    counter = 0
    for i in array:
        summer += i
        counter += 1
    return float(summer / counter)

def average_data_rate(x_array, y_array):
    num_bits = 0
    for i in y_array:
        num_bits += (i * 8)
    return float(num_bits / float(float(x_array[len(x_array) - 1] - x_array[0])) / 1000)

current_window_x = []
current_window_y = []
# Initial setup
if repetitions:
    real_window_length = float(window_length) / 1000
    upper_bound = real_window_length
    lower_bound = 0.0
    max_time = 0
    for i in x:
        if i > max_time:
            max_time = i
    for i in y:
        if i > max_time:
            max_time = i
            
    # Initial window setup
    for i in x:
        if i < real_window_length:
            current_window_x.append(i)
    for i in y:
        if i < real_window_length:
            current_window_y.append(i)

    while upper_bound < max_time:
        if len(current_window_x) > 0:
            actual_x.append(average_array(current_window_x))
            actual_y.append(len(current_window_x) - len(current_window_y))

        current_window_x = []
        current_window_y = []
        #        current_window_x.clear()
        #        current_window_y.clear()

        lower_bound = real_window_length
        upper_bound += real_window_length

        for i in x:
            if i < upper_bound and i > lower_bound:
                current_window_x.append(i)
        for i in y:
            if i < upper_bound and i > lower_bound:
                current_window_y.append(i)
else:
    if (window_length > len(x) or window_length > len(y)):
        print "The length of the window cannot be greater than the number of packets or data points"
        print "Aborting..."
        sys.exit(1)
    # Initial setup of window
    for i in range(0, window_length):
        current_window_x.append(x[i])
        current_window_y.append(y[i])
    
    for i in range(window_length + 1, len(y) - 1):
        if token == 'frame.cap_len':
            actual_x.append(average_array(current_window_x))
            actual_y.append(average_data_rate(current_window_x, current_window_y))
        else:
            actual_x.append(average_array(current_window_x))
            actual_y.append(average_array(current_window_y))

        current_window_x.pop(0)
        current_window_y.pop(0)

        current_window_x.append(x[i])
        current_window_y.append(y[i])

# Making the graph nice...
print 'Making the graph nice...'
plt.xlabel('Time (s)')
if token == 'frame.time_delta':
    title = 'Time Delta Graph'
    ylabel = 'Time Delta (s)'
    plt.ylim([0, .01])
elif token == 'radiotap.datarate':
    title = 'Data Rate Graph'
    ylabel = 'Data Rate (Mb/s)'
    plt.ylim([0, 160])
elif token == 'radiotap.dbm_antsignal':
    title = 'Signal Strength Graph'
    ylabel = 'Signal Strength (dBm)'
elif token == 'frame.cap_len':
    title = 'Throughput Graph'
    ylabel = 'Throughput (Kb/s)'
    plt.ylim([0, 3500])
elif token == 'caplen':
    title = 'Packet Size Graph'
    ylabel = 'Packet Size (B)'
    plt.ylim([0, 1200])
elif token == 'data.data':
    title = 'Repeated Packet Graph'
    ylabel = 'Repeated Packets (#)'
elif token == 'cdf':
    title = 'CDF Graph'
    ylabel = 'CDF'
    plt.ylim([0, 1.01])
    plt.xlabel('Timedeltas (s)')
if repetitions:
    title = 'Repeated Packets Graph'
    ylabel = 'Repeated Packets (#)'

fig.suptitle(title)
plt.ylabel(ylabel)

if token == 'cdf':
    sorted_vals = np.sort( actual_y )
    yvals = np.arange(len(sorted_vals))/float(len(sorted_vals))
    ax1.plot( sorted_vals, yvals )
else:
    ax1.plot(actual_x, actual_y)
    plt.xlim([0, actual_x[len(actual_x) - 1]])
try:
    if repetitions:
        plt.savefig(input_file[:-4].split('/')[1] + "_repetitions.png")
    elif token == 'frame.cap_len':
        plt.savefig(input_file[:-4] + "_throughput.png")
    elif token == 'data.data':
        plt.savefig(input_file[:-4] + "_repeats.png")
    else:
        plt.savefig(input_file[:-4] + "_" + token.split('.')[1] + '.png')
except:
    if token == 'caplen':
        plt.savefig(input_file[:-4] + "_packet_size.png")
    else:
        plt.savefig(input_file[:-4] + "_" + token + '.png')
#plt.show()
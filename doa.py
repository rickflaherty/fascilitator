"""Interfaces betwen the mic array and other code."""
import time
import sys
import usb.util
import usb.core
from tuning import Tuning


def get_doa(tuning):
    """Get the direction-of-arrival of the voice."""
    print(tuning.direction, flush=True)


def setup():
    """Set up the mic tuning."""
    dev = usb.core.find(idVendor=0x2886, idProduct=0x0018)

    if dev:
        tuning = Tuning(dev)
        return tuning


def main():
    """Go through all steps at once, mainly for debugging."""
    dev = usb.core.find(idVendor=0x2886, idProduct=0x0018)

    if dev:
        tuning = Tuning(dev)
        print(tuning.direction)
        while True:
            try:
                print(tuning.direction)
                time.sleep(1)
            except KeyboardInterrupt:
                break


if __name__ == "__main__":
    while True:
        data = sys.stdin.readline()
        data = data.split('\n')[0]
        if data == 'setup':
            mic_tuning = setup()
        elif data == 'doa':
            get_doa(mic_tuning)
        elif data == 'doaRepeat':
            while True:
                get_doa(mic_tuning)
                time.sleep(0.5)
        elif data == 'main':
            main()


from pydub import AudioSegment
import simpleaudio as sa
import subprocess

# Generate the raw audio data
process = subprocess.Popen(
    ['piper.exe', '-m', 'en_US-hfc_female-medium.onnx', '-c', 'en_en_US-hfc_female-medium.onnx.json', '--output-raw'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE
)
process.stdin.write(b"Surprisingly, the proportion of errors in the validation set appears to be largely stable when measured against increasing solar activity. In fact, it can be observed that the percentage of incorrect associations appears to decrease with higher sunspot numbers, a rather counterintuitive result. Both correct and unclear associations remain more consistent except for a sudden increase in unclear events in the range between 130 and 150 sunspots. The last two data points where no correct association is recorded can be deemed to be statistically irrelevant as they are based on only one measurement each.")
process.stdin.close()

# Read the raw audio data
raw_audio = process.stdout.read()
process.stdout.close()

# Convert the raw audio data to an AudioSegment
audio = AudioSegment(
    raw_audio,
    frame_rate=22050,
    sample_width=2,
    channels=1
)

# Adjust the frame rate to slow down the audio
slower_audio = audio._spawn(audio.raw_data, overrides={"frame_rate": 18000})

# Ensure the sample rate is correct for playback
slower_audio = slower_audio.set_frame_rate(22050)

# Play the audio
play_obj = sa.play_buffer(slower_audio.raw_data, num_channels=slower_audio.channels, bytes_per_sample=slower_audio.sample_width, sample_rate=slower_audio.frame_rate)
play_obj.wait_done()

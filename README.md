# Images-diff #

## Description ##

Compare images and report the differences.

Given images `a.jpeg`, `b.jpeg`, and `c.jpeg`, the program performs the
following comparisons:

* `a.jpeg` and `b.jpeg`
* `b.jpeg` and `c.jpeg`

The differences can be computed using MSE (mean error squared) or SSIM
(structural similarity index measure) as the metric.

## Requirements ##

* Node.js (`>=20`).
* ImageMagick (`>=7.1`), when MSE is used as the metric.
* FFmpeg (`>=6.1`), when SSIM is used as the metric.

## Installation ##

0. `npm clean-install --omit=dev`

## Configuration ##

Create a configuration file with the name `.env`. The configuration file
controls the following:

* `MAGICK_PATH`: Path of ImageMagick.
  * If `magick` (for UNIX/ Linux system) or `magick.exe` is in the `PATH`
    environment variable, it is not necessary to specify the full path, the
    executable name itself is sufficient.
* `FFMPEG_PATH`: Path of FFmpeg.
  * If `ffmpeg` (for UNIX/ Linux system) or `ffmpeg.exe` is in the `PATH`
    environment variable, it is not necessary to specify the full path, the
    executable name itself is sufficient.
* `METRIC`: Comparison metric. Acceptable values are `mse` and `ssim`.
* `DIFF_THRESHOLD`: Difference threshold. If the difference is beyond the
  threshold, the comparison pair is considered as abnormal.
* `ABNORMAL_IMAGES_DIRECTORY`: The directory to be created for abnormal images.
  If specified, the directory will be created under the input directory.
* Set all of the following to crop to the area to be inspected:
  * `CROP_WIDTH`: The width of a cropped image.
  * `CROP_HEIGHT`: The height of a cropped image.
  * `CROP_OFFSET_X`: The offset from the left of the original image.
  * `CROP_OFFSET_Y`: The offset from the top of the original image.

An example, `.env.template`, is provided as a reference.

## Examples ##

Assume the directory `/path/to/images` contains some images for comparisons and
using SSIM as the metric, execute:

```
node index.js /path/to/images
```

The output will be similar to the following:

```
[OKAY] 01.png, 02.png: 1
[OKAY] 02.png, 03.png: 1
[OKAY] 03.png, 04.png: 1
[WARN] 04.png, 05.png: 0.250075
```

The output shows that:

* The difference between `01.png` and `02.png` is 0 and within threshold.
* The difference between `02.png` and `03.png` is 0 and within threshold.
* The difference between `03.png` and `04.png` is 0 and within threshold.
* The difference between `04.png` and `05.png` is 0.250075 and below threshold.

If `ABNORMAL_IMAGES_DIRECTORY` is specified, `04.png` and `05.png` will be
copied to the directory.

If the images cannot be compared, for example due to corrupted file headers, and
ImageMagick or FFmpeg is unable to complete the comparison, an error may be
printed on stderr. For example:

```
Compare program exited with code 1 when comparing 01.avif and 02.avif.
```

In such case, the differences between the images will be set to `null`. For
example:

```
[WARN] 01.avif, 02.avif: null
```

The involved files will be copied to `ABNORMAL_IMAGES_DIRECTORY`.

## License ##

[The BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause)

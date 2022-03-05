# Images-diff #

## Description ##

Compare images and report the differences.

Given images `a.jpeg`, `b.jpeg`, and `c.jpeg`, the program performs the
following comparisons:

* `a.jpeg` and `b.jpeg`
* `b.jpeg` and `c.jpeg`

The differences are computed using MSE (mean error squared) as the metric.

## Requirements ##

* Node.js (`>=16`).
* ImageMagick (`>=7.1`).

## Installation ##

0. `npm clean-install --production`

## Configuration ##

Create a configuration file with the name `.env`. The configuration file
controls the following:

* `MAGICK_PATH`: Path of ImageMagick.
  * If `magick` (for UNIX/ Linux system) or `magick.exe` is in the `PATH`
    environment variable, it is not necessary to specify the full path, the
    executable name itself is sufficient.
* `DIFF_THRESHOLD`: Maximum accepted difference between 2 images. The program
  reports an error if the difference between 2 images is greater than this
  value.
* `ABNORMAL_IMAGES_DIRECTORY`: The directory to be created for abnormal images.
  If specified, the directory will be created under the input directory.
* Set all of the following to crop to the area to be inspected:
  * `CROP_WIDTH`: The width of a cropped image.
  * `CROP_HEIGHT`: The height of a cropped image.
  * `CROP_OFFSET_X`: The offset from the left of the original image.
  * `CROP_OFFSET_Y`: The offset from the top of the originam image.

An example, `.env.template`, is provided as a reference.

## Examples ##

Assume the directory `/path/to/images` contains some images for comparisons,
execute:

```
node index.js /path/to/images
```

The output will be similar to the following:

```
[OKAY] 01.png, 02.png: 0
[OKAY] 02.png, 03.png: 0
[OKAY] 03.png, 04.png: 0
[WARN] 04.png, 05.png: 0.75
```

The output shows that:

* The difference between `01.png` and `02.png` is 0 and within threshold.
* The difference between `02.png` and `03.png` is 0 and within threshold.
* The difference between `03.png` and `04.png` is 0 and within threshold.
* The difference between `04.png` and `05.png` is 0.75 and above threshold.

If `ABNORMAL_IMAGES_DIRECTORY` is specified, `04.png` and `05.png` will be
copied to the directory.

## License ##

[The BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause)

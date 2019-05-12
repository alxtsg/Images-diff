# Images-diff #

## Description ##

Compare images in batch and report the differences.

## Requirements ##

* Node.js (`>=10.15.3`).
* GraphicsMagick (`>=1.3.31`).

## Installation ##

0. Install Node.js.
1. Install GraphicsMagick.
2. Update configuration file `config.json`.
3. Start the application by `node index.js <images-directory>`, where `<images-directory>` is the path of directory containing images for comparisons.

## Usage ##

The configuration file `config.json` controls the following:

* `gmPath`: The absolute path of GraphicsMagick executable.
* `differenceThreshold`: The maximum mean squared error (MSE) that can be tolerated for each comparison.
* `abnormalImagesDirectory`: The directory where abnormal images will be copied into. The directory will be created automatically under the directory which containing images for analysis. If it is not specified, abnormal images will not be copied.
* `crop`: If set to `null`, the images will not be cropped before comparsion. To crop the images, specify the following:
    * `width`: Width of the cropped image.
    * `height`: Height of the cropped image.
    * `offsetX`: Offset of location from the left of the image.
    * `offsetY`: Offset of location from the top of the image.

## Examples ##

Assuming the directory containing images for comparisons is `/path/to/images`, execute:

`node index.js /path/to/images`

You will get output similar to the following:

> Start comparing images at 2018-02-03T20:40:12.179Z.

> Completed comparing images at 2018-02-03T20:58:50.500Z.

> /path/to/images/20180201-002618.jpeg, /path/to/images/20180201-002623.jpeg, 0.1477564507: WARN.

> /path/to/images/20180201-002644.jpeg, /path/to/images/20180201-002649.jpeg, 0.0002248027: OKAY.

> (A lot of similar lines...)

> Start copying images at 2018-02-03T20:58:51.255Z.

> Completed copying images at 2018-02-03T20:58:51.452Z.

The output above shows:

* The timestamp of beginning and end of comparisons.
* `20180201-002618.jpeg` differs very much from `20180201-002623.jpeg` (MSE is 0.1477564507, which is above the `differenceThreshold`), so it gives a `WARN` message.
* `20180201-002644.jpeg` looks similar to `20180201-002649.jpeg` (MSE is 0.0002248027, which is below the `differenceThreshold`), so it gives a `OKAY` message.
* The timestamp of beginning and end of copying of abnormal images.

## License ##

[The BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause)

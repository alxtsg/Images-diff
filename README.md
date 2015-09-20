# Images-diff #

## Description ##

Compares images in a directory in sequential manner and report the differences.

## Requirements ##

* io.js (`>=3.1.0`).
* GraphicsMagick (`>=1.3.21`).

## Installation ##

0. Install Node.js.
1. Install GraphicsMagick.
2. Start the application by `node index.js <config> <images-directory>`, where `<config>` is the path of configuration file and `<images-directory>` is the path of directory containing images for comparisons.

## Usage ##

The configuration file `config.json` controls the following:

* `gmPath`: The path of GraphicsMagick executable. Useful when GraphicsMagick is not in PATH environment variable.
* `differenceTheshold`: The maximum mean squared error (MSE) can be tolerated for each comparison.
* `abnormalImagesDirectoryName`: The directory name where abnormal images will be copied into. The directory will be created automatically under the directory which containing images for analysis. If it is not specified, abnormal images will not be copied.

## Examples ##

Assuming the directory containing images for comparisons is `/path/to/images/directory`, execute:

`node index.js config.json /path/to/images/directory`

You will get output similar to the following:

> Start at 2015-09-06T16:05:22.282Z.

> 20150518-005330.jpeg, 20150518-005335.jpeg: WARN, 0.0031047677

> (A lot of lines are omitted.)

> 20150518-005405.jpeg, 20150518-005410.jpeg: OKAY, 0.0000980678

> Completed at 2015-09-06T16:20:28.192Z.

The output above shows that `20150518-005335.jpeg` differs very much from `20150518-005330.jpeg`, thus `WARN`; `20150518-005410.jpeg` looks similar to `20150518-005405.jpeg`, thus `OKAY`.

## License ##

This project is for private use only.

# Images-diff #

## Description ##

Compares images in a directory in sequential manner and report the differences.

## Requirements ##

* Node.js (`>=4.2.2`).
* GraphicsMagick (`>=1.3.23`).

## Installation ##

0. Install Node.js.
1. Install GraphicsMagick.
2. Start the application by `node index.js <images-directory>`, where `<images-directory>` is the path of directory containing images for comparisons.

## Usage ##

The configuration file `config.json` controls the following:

* `gmPath`: The path of GraphicsMagick executable `gm` on BSD UNIX or `gm.exe` on Windows.
* `differenceThreshold`: The maximum mean squared error (MSE) that can be tolerated for each comparison.
* `abnormalImagesDirectoryName`: The directory name where abnormal images will be copied into. The directory will be created automatically under the directory which containing images for analysis. If it is not specified, abnormal images will not be copied.

## Examples ##

Assuming the directory containing images for comparisons is `/path/to/images/directory`, execute:

`node index.js /path/to/images/directory`

You will get output similar to the following:

> Start at 2015-09-06T16:05:22.282Z.

> Completed at 2015-09-06T16:20:28.192Z.

> 20150518-005330.jpeg, 20150518-005335.jpeg: WARN, 0.0031047677

> (A lot of lines are omitted.)

> 20150518-005405.jpeg, 20150518-005410.jpeg: OKAY, 0.0000980678

The output above shows that `20150518-005335.jpeg` differs very much from `20150518-005330.jpeg`, thus `WARN`; `20150518-005410.jpeg` looks similar to `20150518-005405.jpeg`, thus `OKAY`.

## License ##

[The BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause)

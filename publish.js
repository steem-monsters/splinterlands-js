const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const dist_file_path = path.resolve(__dirname, './dist');

// MIME type dictionary
const mime_types = {
	png:    `image/png`,
	svg:    `image/svg+xml`,
	jpg:    `image/jpeg`,
	gif:    `image/gif`,
	mp3:    `audio/mpeg`,
	html:   `text/html`,
	json:   `text/json`, // changed application to text to enable opening in UI
	js:     `text/javascript`,
	shader: `text/x-csh`, // closest thing to a c mime type, application => text
	map:    `text/map`, // Can actually be default/blank but this makes it open in UI
	css:    `text/css`,
	woff:   `font/woff`,
	eot:    `application/vnd.ms-fontobject`,
	ttf:    `font/ttf`,
	woff2:  `font/woff2`,
	// SOURCE: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types
};

publish();

async function publish() {
	let bucket = 'steemmonsters';
	let folder = 'dist-dev';
	let invalidate = false;

	// Parse command line arguments
	for(let i = 0; i < process.argv.length; i++) {
		let arg = process.argv[i];

		if(arg.startsWith('-bucket'))
			bucket = arg.split('=')[1];

		if(arg.startsWith('-folder'))
			folder = arg.split('=')[1];

		if(arg.startsWith('-invalidate'))
			invalidate = arg.split('=')[1] == 'true';
	}

	upload_files(bucket, folder);

	if(invalidate)
		invalidate_files(folder, getFileList(dist_file_path));
}

async function upload_files(bucket, folder) {
	let uploaded = 0;
	let files = getFileList(dist_file_path);

	log(`Uploading ${files.length} files to the [${bucket}] bucket...`);

	await Promise.all(files.map(file => {
		let mime_type = mime_types[file.substring(file.lastIndexOf('.') + 1)];

		let params = {
			Bucket: bucket,
			Key: (folder ? folder + '/' : '') + file.substring(dist_file_path.length + 1).replace(/\\/g, '/'),
			Body: fs.readFileSync(file),
			CacheControl: '604800'
		}

		if(mime_type)
			params.ContentType = mime_type;

		return new Promise((resolve, reject) => {
			s3.putObject(params, (err, data) => {
				if(err) {
					reject(err);
					return;
				}

				process.stdout.write(`\r   ${++uploaded} / ${files.length} files uploaded...[${['|', '/', '-', '\\'][uploaded % 4]}]`);
				resolve();
			});
		});
	}));

	console.log('');
	log(`Upload complete!`);
}

function getFileList(dir_path) {
	let files = [];

	let dir = fs.readdirSync(dir_path);
	dir.forEach(file => {
		let file_path = path.join(dir_path, file);
		let stat = fs.statSync(file_path);

		if(stat.isFile())
			files.push(file_path);
		else if(stat.isDirectory())
			files = files.concat(getFileList(file_path))
	});

	return files;
}

async function invalidate_files(folder, files) {
	var params = {
		DistributionId: 'E1Y67G6LJ49H8H', 
		InvalidationBatch: {
			CallerReference: Date.now() + '',
			Paths: {
				Quantity: files.length,
				Items: files.map(file => '/' + (folder ? folder + '/' : '') + file.substring(dist_file_path.length + 1).replace(/\\/g, '/'))
			}
		}
	};

	log(`Invalidating ${files.length} files...`);

	return new Promise((resolve, reject) => {
		cloudfront.createInvalidation(params, function(err, data) {
			if (err) {
				console.log(err, err.stack); // an error occurred
				reject(err);
			} else {
				console.log(data);           // successful response
				resolve(data);
			}
		});
	});
}

// Logging levels: 1 = Error, 2 = Warning, 3 = Info, 4 = Debug
function log(msg, level, color) { 
  if(!level)
		level = 0;
		
	if(color && log_colors[color])
		msg = log_colors[color] + msg + log_colors.Reset;

  console.log(new Date().toLocaleString() + ' - ' + msg); 
}
var log_colors = {
	Reset: "\x1b[0m",
	Bright: "\x1b[1m",
	Dim: "\x1b[2m",
	Underscore: "\x1b[4m",
	Blink: "\x1b[5m",
	Reverse: "\x1b[7m",
	Hidden: "\x1b[8m",

	Black: "\x1b[30m",
	Red: "\x1b[31m",
	Green: "\x1b[32m",
	Yellow: "\x1b[33m",
	Blue: "\x1b[34m",
	Magenta: "\x1b[35m",
	Cyan: "\x1b[36m",
	White: "\x1b[37m",

	BgBlack: "\x1b[40m",
	BgRed: "\x1b[41m",
	BgGreen: "\x1b[42m",
	BgYellow: "\x1b[43m",
	BgBlue: "\x1b[44m",
	BgMagenta: "\x1b[45m",
	BgCyan: "\x1b[46m",
	BgWhite: "\x1b[47m"
}
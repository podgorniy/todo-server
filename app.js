var fs = require('fs')
var path = require('path')
var express = require('express')
var app = express()


/**
 * Static
 */

const PORT = process.env.PORT || 5000
const DATA_DIR = path.join(__dirname, 'data')
const BASE_DELAY = 500
const DELAY_SPREAD = 1000



/**
 * Helpers
 */

function readJSON (path, cb) {
	fs.readFile(path, 'utf-8', function (err, fileContents) {
		if (err) {
			cb(err)
			return
		}
		var json
		try {
			json = JSON.parse(fileContents)
		} catch (parseError) {
			cb({
				name: parseError.name,
				message: parseError.message
			})
			return
		}
		cb(null, json)
	})
}

function writeJSON (path, data, cb) {
	fs.writeFile(path, JSON.stringify(data, null, '	'), 'utf-8', cb)
}

/**
 * Middleware
 */

// Emulate server response delay
app.use(function (req, res, next) {
	setTimeout(next, BASE_DELAY + Math.random() * DELAY_SPREAD)
})

app.use(express.json())
app.use(express.urlencoded())
app.use(express.static('static'))

/**
 * Routing
 */

// List of all todo lists
app.get('/todos', function (req, res) {
	fs.readdir(DATA_DIR, function (err, data) {
		if (err) {
			res.status(500)
			res.send({
				error: err
			})
			return
		}
		res.send(data.map(function (fileName) {
			return fileName.split('.')[0]
		}))
	})
})

// Create todo list
app.post('/todos/:listName', function (req, res) {
	if (!req.body.todo) {
		res.status(500)
		res.send({
			updated: false,
			error: {
				name: 'Empty param',
				message: 'Param "todo" can\'t be empty'
			}
		})
		return
	}

	if (typeof req.body.todo !== 'string') {
		res.status(500)
		res.send({
			updated: false,
			error: {
				name: 'Wrong param type',
				message: 'Expected "todo" param to be string'
			}
		})
		return
	}

	// Invalid JSON body
	var parsedListData
	try {
		parsedListData = JSON.parse(req.body.todo)
	} catch (parseError) {
		res.status(500)
		res.send({
			updated: false,
			error: {
				name: parseError.name,
				message: parseError.message
			}
		})
		return
	}

	var dataPath
	dataPath = path.join(DATA_DIR, req.params.listName + '.json')
	if (!fs.existsSync(dataPath)) {
		writeJSON(dataPath, parsedListData, function (err) {
			if (err) {
				res.status(500)
				res.send({
					created: false,
					error: err
				})
				return
			}
			res.send({
				created: true
			})
		})
	} else {
		res.send({
			created: false,
			error: {
				name: 'Task already exists',
				message: 'Task already exists'
			}
		})
	}
})

// Read todo list contents
app.get('/todos/:listName', function (req, res) {
	readJSON(path.join(DATA_DIR, req.params.listName + '.json'), function (err, json) {
		if (err) {
			res.status(500)
			res.send({
				error: err
			})
			return
		}
		res.send(json)
	})
})

// Update
app.put('/todos/:listName', function (req, res) {
	if (!req.body.todo) {
		res.status(500)
		res.send({
			updated: false,
			error: {
				name: 'Empty param',
				message: 'Param "todo" can\'t be empty'
			}
		})
		return
	}

	if (typeof req.body.todo !== 'string') {
		res.status(500)
		res.send({
			updated: false,
			error: {
				name: 'Wrong param type',
				message: 'Expected "task" param to be string'
			}
		})
		return
	}

	// Invalid JSON body
	var parsedListData
	try {
		parsedListData = JSON.parse(req.body.todo)
	} catch (parseError) {
		res.status(500)
		res.send({
			updated: false,
			error: {
				name: parseError.name,
				message: parseError.message
			}
		})
		return
	}

	var dataPath
	dataPath = path.join(DATA_DIR, req.params.listName + '.json')
	if (fs.existsSync(dataPath)) {
		writeJSON(dataPath, parsedListData, function (err) {
			if (err) {
				res.status(500)
				res.send({
					updated: false,
					error: err
				})
				return
			}
			res.send({
				updated: true
			})
		})
	} else {
		res.send({
			updated: false,
			error: {
				name: 'Task list does not exist',
				message: 'Task list does not exist'
			}
		})
	}
})

// Delete todo
app.delete('/todos/:listName', function (req, res) {
	fs.unlink(path.join(DATA_DIR, req.params.listName + '.json'), function (err) {
		if (err) {
			res.status(500)
			res.send({
				deleted: false,
				error: err
			})
			return
		}
		res.send({
			deleted: true
		})
	})
})

app.listen(PORT)
console.log('App started at', PORT)
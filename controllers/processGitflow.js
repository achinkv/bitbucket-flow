const request = require('request');

const HOST = 'https://api.bitbucket.org';
const ROOTPATH = HOST + '/2.0/repositories';

const ENDPOINT_REPO = ROOTPATH + '/';
const ENDPOINT_BRANCH = ROOTPATH + '/';
const ENDPOINT_CREATE = 'https://bitbucket.org/branch/create'

var amgrbb = {
    _doBitBucketRequest: function(url, type, credentials, payload, accessAllowed, callback) {
        // console.log(payload);
        var options = {
            'url': url,
            'auth': {
                'user': credentials.username,
                'pass': credentials.password
            }
        }
        var requestComplete = function(err, res, body) {
            if (err) {
                console.log("Error", err, body);
                callback(err);
            } else {
                // console.log(body);
                callback(null, body);
            }
        }
        options.method = type;
        if (options.method === 'GET') {

            request.get(options, requestComplete);
        } else if (options.method === 'POST') {
            options.headers = {
                "Content-Type": "application/json"
            };
            options.json = payload;
            request.post(options, requestComplete);
        } else if (options.method === 'PUT') {
            options.headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            options.body = accessAllowed;
            request.put(options, requestComplete);
        }
    },

    getUser: function(credentials, callback) {
        this._doBitBucketRequest(ENDPOINT_REPO + credentials.username, 'GET', credentials, null, callback);
    },

    createRepo: function(credentials, name, project, callback) {
        var url = ENDPOINT_REPO + "myorginc/" + name;
        var bbOptions = {
            'scm': 'git',
            'has_wiki': true,
            'is_private': true,
            "project": {
                "key": project
            },
            "full_name": "myorginc/" + name,
            "repository": {
                "owner": {
                    "username": "myorginc",
                    "first_name": "MYORG",
                    "last_name": "",
                    "display_name": "MYORG",
                    "is_team": true,
                    "avatar": "https://bitbucket.org/account/MYORG/avatar/32/?ts=1476682642"
                },
                "name": name,
                "slug": name
            }
        };
        this._doBitBucketRequest(url, 'POST', credentials, bbOptions, null, callback);
    },
    getRepo: function(credentials, name, callback) {
        var url = ENDPOINT_REPO + "myorginc/" + name;
        this._doBitBucketRequest(url, 'GET', credentials, null, null, callback);
    },
    setRestrictions: function(credentials, name, groupName, accessAllowed, callback) {
        var url = "https://api.bitbucket.org/1.0/group-privileges/myorginc/" + name + "/myorginc/" + groupName;
        this._doBitBucketRequest(url, 'PUT', credentials, null, accessAllowed, callback);

    }

}

exports.amgrbb = amgrbb;

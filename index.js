'use strict';

var nodegit = require('nodegit'),
    processGitflow = require('./controllers/processGitflow'),
    cred = nodegit.Cred;
var path = require("path");
var Q = require('q');
var prompt = require('prompt');
var colors = require("colors/safe");
var promisify = require("promisify-node");
var fse = promisify(require("fs-extra"));
const fileArr = ["README.md", "release-notes", "version"];
const branchArr = ["qa", "dev", "sandbox"];
var repoDir = "/tmp/";
try {
    require.resolve('./projectconf');
} catch (e) {
    console.error("projectconf file is not found in the root of directory.");
    process.exit(e.code);
}
var config = require('./projectconf');

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) console.log('Bye Bye!');
    // if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

var credentials = {
    username: '',
    email: '',
    password: ''
};

var processCommitFlow = function index() {

        var createBranches = function(branchName, dirPath) {// Create and push a branch to remote origin.
            var remote;
            // console.log("repodir", dirPath);
            nodegit.Repository.open(path.resolve(__dirname, dirPath))
                .then(function(repo) {
                    // Create a new branch on head
                    // console.log("In create branch", repo);
                    return repo.getHeadCommit()
                        .then(function(commit) {
                            return repo.createBranch(
                                branchName,
                                commit,
                                0,
                                repo.defaultSignature(),
                                "Created " + branchName + " on HEAD");

                        })
                        .then(function() {
                            return repo.getRemote("origin");
                        }).then(function(remoteResult) {

                            // console.log('remote Loaded');
                            remote = remoteResult;

                            // Create the push object for this remote
                            var ref = "refs/heads/" + branchName + ":refs/heads/" + branchName;
                            return remote.push(
                                [ref], {
                                    callbacks: {
                                        credentials: function() {
                                            return cred.userpassPlaintextNew(credentials.email, credentials.password);
                                        }
                                    }
                                }
                            );
                        })

                    .catch(function(reason) {
                        console.log('branchReason', reason);
                    })
                })
                .catch(function(reason) {
                    console.log('branchReason1', reason);
                })
                .done(function() {
                    console.log(".............................................................................");
                    console.log(colors.green(branchName, "branch created and pushed!"));
                });
        };




        var writeFiles = function(remoteLink, repoName, credentials, fileArr, repoDir) {
            var repository;
            var index;
            var remote;
            var oid;

           //first we copy the contents of the commitFolder to the new directory, then we initialize git repository and open it. Then we add files to git tracking and write to the tree then make a commit.
            fse.removeSync(path.resolve(__dirname, repoDir));
            fse.copy(path.resolve(__dirname, "./commitFolder"), path.resolve(__dirname, repoDir))
                .then(function() {
                     console.log("Intiializing repository...");
                    return nodegit.Repository.init(path.resolve(__dirname, repoDir), 0)
                })
                .then(function() {
                    console.log("Connecting to repository...");
                    return nodegit.Repository.open(path.resolve(__dirname, repoDir + "/.git"))
                })
                .catch(function(reason) {
                    console.log("There was a problem");
                    console.log('Connection failed', reason);
                })
                .then(function(repo) {
                    repository = repo;
                })
                .catch(function(reason) {
                    console.log("There was a problem");
                    console.log("Setting up repo failed", reason);
                })
                .then(function() {
                    console.log("Refreshing repository index...");
                    return repository.refreshIndex();
                })
                .catch(function(reason) {
                    console.log("There was a problem");
                    console.log("Refresh failed", reason);
                })
                .then(function(idx) {
                    console.log("Setting up index...");
                    index = idx;
                }).catch(function(reason) {
                    console.log("failed", reason);
                })
                .then(function() {
                    console.log("Adding files...");
                    var _a = [];
                    for (var i = 0; i < fileArr.length; i++) {
                        // this file is in a subdirectory and can use a relative path
                        _a[i] = index.addByPath(fileArr[i]);
                    }
                    return Q.all(_a);
                })
                .then(function() {
                    console.log("Adding to index...");
                    return index.write();
                })
                .then(function() {
                    console.log("Adding to tree...");
                    return index.writeTree();
                })
                .catch(function(reason) {
                    console.log("Writing to tree failed", reason);
                })
                .then(function(oid) {
                    var author = nodegit.Signature.now(credentials.name, credentials.email);
                    var committer = nodegit.Signature.now(credentials.name, credentials.email);
                    // Since we're creating an inital commit, it has no parents. Note that unlike
                    // normal we don't get the head either, because there isn't one yet.
                    console.log("Creating commits...");
                    return repository.createCommit("HEAD", author, committer, "First Commit", oid, []);
                }).catch(function(reason) {
                    console.log("Commmit creation failed", reason);
                    if (reason === "Error: failed to create commit: current tip is not the first parent") {
                        console.log("It seems that you already have a directory by the name you provided. Aborting!");
                        return;
                    }
                })
                .then(function(commitId) {
                    console.log(".............................................................................");
                    console.log(colors.green("New Commit", commitId));
                })
                .then(function() {
                    return nodegit.Repository.open(path.resolve(__dirname, repoDir + "/.git"))
                })
                .then(function(repo) {
                    return nodegit.Remote.create(repo, "origin", remoteLink)
                        .then(function(remoteResult) {
                            remote = remoteResult;
                            // Create the push object for this remote
                            return remote.push(
                                ["refs/heads/master:refs/heads/master"], {
                                    callbacks: {
                                        credentials: function() {
                                            return cred.userpassPlaintextNew(credentials.email, credentials.password);
                                        }
                                    }
                                }
                            );
                        });
                })
                .then(function() {
                    console.log(".............................................................................");
                    console.log(colors.green("Master branch created and pushed!"));
                    var _c = [];
                    for (var i = 0; i < branchArr.length; i++) {
                        _c[i] = createBranches(branchArr[i], repoDir + "/.git");
                    }
                    return Q.all(_c);
                })
                .then(function() {
                    processGitflow.amgrbb.setRestrictions(credentials, repoName, config.readGroup, "read", function(err, res) {
                        if (err) {
                            console.log("Error from restrictions >>", err);
                        } else {
                            console.log(".............................................................................");
                            console.log(res);
                        }
                    })
                })
                .then(function() {
                    processGitflow.amgrbb.setRestrictions(credentials, repoName, config.writeGroup, "write", function(err, res) {
                        if (err) {
                            console.log("Error from restrictions >>", err);
                        } else {
                            console.log(".............................................................................");
                            console.log(res);
                        }
                    })
                })
                .then(function() {
                    processGitflow.amgrbb.setRestrictions(credentials, repoName, config.adminGroup, "admin", function(err, res) {
                        if (err) {
                            console.log("Error from restrictions >>", err);
                        } else {
                            console.log(".............................................................................");
                            console.log(res);
                        }
                    })
                })
                .catch(function(reason) {
                    console.log("upload", reason);
                });
        };



        function processInputs() { //Flow begins by asking some questions from the user.
            var schema = {
                    "properties": {
                        "password": {
                            "description": colors.yellow('Enter your Bitbucket Password'),
                            "message": colors.red('Provide a Password'),
                            "hidden": true,
                            "required": true
                        }
                    }
                };

                //
                // Start the prompt
                //
                prompt.start();

                prompt.get(schema, function(err, result) {
                    // Log the results.
                    console.log(colors.green('Command-line input received:'));
                    console.log(colors.green('  Email: ' + config.bitbucketEmail));
                    console.log(colors.green('  Username: ' + config.bitbucketUsername));
                    console.log(colors.green('  Repository: ' + config.name));

                    if (!config) {
                        console.log("Project configuration was not found.");
                        return;
                    }
                    if (!config.name) {
                        console.log("Please provide a valid name in projectconf file.");
                        return;
                    }
                    if(!config.bitbucketEmail || !config.bitbucketUsername){
                      console.log("Please provide a valid bitbucket email and bitbucket username in projectconf file.");
                      return;
                    }


                    credentials.username = config.bitbucketUsername;
                    credentials.email = config.bitbucketEmail;
                    credentials.password = result.password;
                    repoDir = repoDir + config.name;



                    if (fileArr instanceof Array) {
                      //Creation of repository on bitbucket.
                        processGitflow.amgrbb.createRepo(credentials, config.name, config.projectKey, function(err, repo) {
                            if (err) {
                                console.log("There was an error while creating your repo:", err);
                                return;
                            } else if (repo && repo.type === "error") {
                                if (repo && repo.error && repo.error.fields && repo.error.fields.name && (repo.error.fields.name instanceof Array) && repo.error.fields.name[0]) {
                                    console.log(repo.error.fields.name[0])
                                } else if (repo && repo.error && repo.error.fields && repo.error.fields.project && (repo.error.fields.project instanceof Array) && repo.error.fields.project[0]) {
                                    console.log("Project related issue:", repo.error.fields.project[0]);
                                } else {
                                    console.log(repo);
                                }
                            } else if (!err && !repo) {
                                console.log(colors.red("Something wrong with your credentials. Please check them."));
                                return;
                            } else if (repo && repo.type === "repository") {
                              //if type repository then it shows that a new repo has been created on bitbucket.

                                console.log(".............................................................................");
                                // console.log(typeof repo)
                                // console.log(repo)
                                console.log(colors.green("Hey! Your repo has been created and available here: " + (repo && repo.links && repo.links.clone[0].href)));
                                credentials.name = repo && repo.owner && repo.owner.display_name;
                                // return;
                                console.log(".............................................................................");
                                console.log(colors.green("Now, we are writing your local repo."));
                                //After creation we proceed to create files on the local machine.
                                writeFiles(repo.links.clone[0].href, config.name, credentials, fileArr, repoDir);
                            } else {
                                console.log("Mission Aborted.");
                            }
                        });

                    } else {
                        console.log("Files should be in array.");
                        return;
                    }
                });
            }

            processInputs();

        };

        exports.handler = processCommitFlow;

        /** comment for production **/
        processCommitFlow();
        /** end comment for production **/

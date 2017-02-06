#### This is a utility to generate project on bitbucket and commit files initially.
***
- This utility could be useful for teams where lot of projects need to be created on a regular basis. It provides a way to commit the initial required structure for a project and also manage access to the repository.

- It currently works with bitbucket using its API.

- Access like read, write and admin can be given to selective groups.

- First, you need to have  `projectconf`  file ( refer projectconf.sample file for the structure ) in the root directory.

- Keep the values in these files according to your relevant requirements.

- The repository will be created by the name you provide in `projectconf` file against the key 'name'.

- The 'name' must be lowercase, alphanumerical, and may also contain underscores, dashes, or dots.

- `projectconf` file has privileges for the groups on the repository to be created.

- `projectconf` file has  a key 'projectKey', against which the key of the project to be assigned to this repo should be passed. ( Mind the difference: it is projectKey, not the full name of the project.)

- You need to have node.js installed on your machine.

- Run `npm install` for installing the required packages for the utility to work.

- Run `npm start` for starting the commang line utility.

- Input the values asked by the prompt.

- On local machine the repo will be created in `/tmp` directory by the name provided. Make sure there is no directory there by the same 'name'.

- This tool also creates, by the 'name' passed in manifest, a {name}.json file in amazon s3 bucket.

##### Todos :
- Make the organization name, under which project gets registered, to work from config.
- Extend the functionality for github.

# Use Claude Code to Explore and Develop the project 
### Download the zip file of branch 'initial'
https://github.com/uopsdod/claude_code_treasure_game/tree/initial

### initialize the context
/clear
/init: generate the CLAUDE.md to understand how this project works 

npm install
npm run dev'

### specify file to the current context 
> use @src/audios/chest_open.mp3 in the @src/App.tsx to play the sound effect of the chest being opened. do not do anything else.

### add more to the context
> check the comments of existing changes

type '#' first 
"Always add comments on the top of every new function in one line to summarize the usage and Must document the inputs and output parameters" 
> 2. Project memory

> use @src/audios/chest_open_with_evil_laugh.mp3 in the @src/App.tsx to play the sound effect of the chest with skeleton inside being opened  

> check the comments of existing changes

### use screenshot to develop intuitively 
> screenshot and mark the area you want the change to be. 
> [!image] show the results to be either: win, tie, loss in the circled place according to the final score 
![img0](https://github.com/renjmindy/myClaudeCode/blob/main/claude_code_treasure_game-initial/Screenshot%202026-03-12%20103723%20win_tie_loss_claude_code.png)

### Challenge: change the hover mouse point icon
use the src/assets/key.png icon when the mouse hovers over the closed treasure box

> **Prompt**: Please use `src/assets/key.png` to switch the cursor from arrow to key icon while hovering over the closed (unopened) chest. Once a chest is opened, the cursor reverts to the default pointer. 

| Before opening box & not hovering over box | Before opening box & hovering over box | After opening box & hovering over box |
  |--------|---------|---------| 
  | ![img1](https://github.com/renjmindy/myClaudeCode/blob/main/claude_code_treasure_game-initial/863_box_unopened_arrow_cursor.jpg) | ![img2](https://github.com/renjmindy/myClaudeCode/blob/main/claude_code_treasure_game-initial/864_box_unopened_key_cursor.jpg) | ![img3](https://github.com/renjmindy/myClaudeCode/blob/main/claude_code_treasure_game-initial/865_box_opened.jpg) | 


### manage context 
/context 
54k/200k tokens (27%)

> (optional) go through the url recursively to understand everything about SQLite and add all information in the context. 
https://nodejs.org/docs/latest/api/sqlite.html                                                      

/compact

/context 
> 26k/200k tokens (13%)

/clear 

/context
> 16k/200k tokens (8%)

> "Check my project with AngularJS to see if any syntax error."

esc + esc > select a conversation to go back 

### Plan mode: 
make a commit to store the current state

shift + tab 
> "What database options I have to implement sign up and sign in flow?"
> "how about SQLite as local storage?"
> "use SQLite to build a simple sign up and sign in flow and store the game score for each signed in user. In addition, allow to play the game as guest mode without storing any data."

> Ctrl + T: See the To-Do List 

| Simple Sign up / Sign in / guest mode Window | After Sign in |
  |--------|---------|
  | ![img4](https://github.com/renjmindy/myClaudeCode/blob/main/claude_code_treasure_game-initial/Screenshot%202026-03-13%20143529%20sign%20up%20sign%20in.png) | ![img5](https://github.com/renjmindy/myClaudeCode/blob/main/claude_code_treasure_game-initial/Screenshot%202026-03-13%20143407%20log%20in.png) | 

### Ultrathink 
revert back to previous git commit 

> "Ultrathink to use SQLite to build a simple sign up and sign in flow and store the game score for each signed in user. In addition, allow to play the game as guest mode without storing any data."

> Ctrl + T: See the To-Do List 

### custom command - Vercel deployment
- create folder: .claude/commands
- create file: deploy_vercel.md
- after creation, re-open a new claude code session

### custom command - Github Page deployment
- create folder: .claude/commands
- create file: deploy_github_page.md 
- after creation, re-open a new claude code session

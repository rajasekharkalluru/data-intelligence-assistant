I would like to build a tool called "Developer Intelligence Assistant".

The idea is to gather information from all user integrated data sources and index and store it in Vector databases. And then use RAG technique to answer questions from the users. 

This should have three types of User experiences -- 
1. Web Chat UI
2. CLI
3. Slack Bot


Backend -- 
Build in Python


Frontend -- 
Build in ReactJS

There should also be a way for users to plugin their own data sources where data should be fetched in.

Start with building connectors for these tools -- 
1. Confluence
2. Bitbucket
3. JIRA


Have clear segregation of backend and frontend codes.

Have some helper scripts to help with local development also.. One script to start both backend and frontend. 

In local, use local ollama3.2 model and local vector DBs and all. For developemnt and production environments I want to use Oracle Cloud Infrastructure, integrate with Oracle Generate AI and any other Vector DB related stuff there.

There should also be options for user to choose content type like Brief, Concise, Expansive answers etc. I might not have given the exact names but you decide. Also user should be able to decide on temperature and also which integrated sources to search data in. If he choose multiple aggregate best data from those and summarize and provide.

Also provide links to the original content in the response. And those links should be clickable and take you to the original source in new window.


Also make this branding customizable. I would like to use my own company logo later.
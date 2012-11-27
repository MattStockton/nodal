# Nodal: Visually Explore Your Network

**Nodal** is a [D3.js](https://github.com/mbostock/d3/) experiment by [Jesse Vogt](http://jvogt.net), [Matt Stockton](http://mattstockton.com), and [Kris Gösser](http://krisgosser.com). We work at [HarQen](http://harqen.com) in Milwaukee. The idea originally took second place at an Oracle Open World hackathon.

Nodal is a fun way to view your network graph. We wanted to explore what it's like to navigate our network relationships visually. To illustrate the possibilities of node interactions, try drag-selecting a group of nodes. You can also click on individual nodes to get more detailed information and to expand the network.

We see a future where data can be navigated visually. We want more intuitive controls and behaviors. We believe a single command can produce instant understanding for humans through interactive information graphics.

## Under The Hood

D3.js is the primary library for drawing the graph. [jQuery](http://jquery.com/) and [Underscore](http://underscorejs.org/) are fantastic utilities for getting the bulk of our JavaScript needs done.

We use [Python](http://www.python.org/) and [Flask](http://flask.pocoo.org/) on the backend. The public demo is hosted on [Heroku](http://www.heroku.com/).

## See Nodal in action

Visit [nodal.me](http://nodal.me/) to check out the public demo
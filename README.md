# PatentsVisualSearch
CS 448B Final Project

To query the data, we are using the BigQuery API; since our app isn't verified by Google and the BigQuery service is not enitrely free, this only allows authorized users to make queries. Thus to properly use the visualization, you will need to login from an authorized account. To view the visualization follow the steps:
1. Copy and open link using Google Chrome: https://alexasiu.com/CS448B-final/final.html . Important for it to be https. If running from local server, the name should be http://localhost:8080 exactly.  This is because only authorized urls are allowed when authenticating.
2. Make sure pop-ups are enabled. 
3. Once the site loads you should see a pop-up window for a Google login.
4. Login with the following account information
			email: patentsearch448b@gmail.com
			pw:    cs448bauthentication
5. It might give you a warning that the app is not verified. Click Advanced and Continue to website.
6. The popup will automatically close if it authenticated properly. You should be able to now make a query using the search bar.

Note: If not properly authenticated then an error will print on the Console. 
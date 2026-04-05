This is our intelligent lend and borrow tracker. It helps keep track of items you’ve lent out with ease. It helps log what you lent, to whom, when it was lent, and when it’s expected back. It monitors return status effortlessly, and if the borrower is also a registered user, you can send friendly in-app reminders to ensure timely returns.
Whether it’s books, games, tools, kitchenware, or other everyday essentials, our smart system helps you stay organized, avoid confusion, and never lose track of shared items again.

use case scenarios and features of this website:

I hardcoded dog and admin in my app. I also hardcoded 6 items as the initialized data, Among which 5 items have not been borrowed yet and one item was already borrowed by bob. If you sign up and log in as bob, you can see this item in My Borrowing section. For the other items, any users, after log in can see the other 5 items in either available to borrow section or discover page. It can help you test functions in my app with ease and see the pagination feature I added without any input efforts in discover page. 

You can use the below username info to log in and check: 
dog
username: "dog"
admin
username: "admin"


1. Everyone is allowed to see intro and about page. However, This website has different levels of authorization: The normal users and admin users. 
   For normal users, before login, there will be sign up and log in in Home page. the user can only browse the home and About page. For users who have not yet logged in, they can see login and sign up and the below intro on home page and about page. But the lend, discover and borrow pages are shown as empty to them. The content of these pages are only accessible to the logged in users.
   For admin users, admin users can see the main data of all users. Admin username: admin; Admin email: admin@gmail.com. Admin can access the main data of all users. There are some already hard coded user data there.

2. After login, the user can see the dashboard on home page. If the network is slow, there will shown loading indicator for the users. The dashboard has a brief introduction of user's lending, borrowing, reserving situation and the items that are available to borrow and the user can do the operation on the items shown on the dashboard. But to make dashboard clean and clear, each area can only show 3 item data at most.

3. Except Reserve page, the user can either click the go button under each area or the corresponding navigation link to enter the related page for viewing more items and operating on these items. Since reserving is an operation related with borrow, there is no navigation link in the header for reserve. But users can go to reserve page by clicking the "Go Reserve" button under the My Reserving section on dashboard. Except that, The other pages can both be visited via either "Go button" or the navigation link. "Go lend" button under My Lending and Lend in navigation can lead to lend page. "Go Borrow" under My Borrowing and Borrow in navigation can lead to borrow page. "Go Discover" button under Available to Borrow and Discover in navigation can lead to discover page.

4. On Lend page The user can add, modify, and remove their lent out items data. Each item has the below specific data.
including name, category, lend date, expected return date, and description. The user cannot borrow their own lent out items since their lent out items will not be shown on discover page.

5. On Discover page, the user can either borrow or reserve the items lent out from other lenders. When borrowing an item, the user need to input a due date no later than the expected return date. The default borrow date is the current date. Once the item is borrowed, it will be shown on the borrow page. If the user wants the item but do not need to borrow it right now, they can reserve the date on the discove page as well.

6. On Borrow page, the user can return the items they have borrowed before. 

7. On Reserve page, the user can modify the date of the reserved item including its start date and due date, or change the operation from reservaiton to borrow now, or cancel the reservation. 

8. For the lender, if the item is due but the borrower has not returned the item, the item will have an "Overdue" warning on items on lend page. You can deliberately enter a due date in the past.

9. For the borrower, if the item this borrower borrowed is due within 7 days or already overdue. This information will be shown on the reminders for borrower on the Dashboard.


Bonus features 

Bonus Requirements: Extra Service Interaction Complexity

Additional HTTP methods (-used in an appropriate RESTful way) beyond the minimum required 3

- the http methods applied in my services meet the requirements.

Services with (used) pagination

- I used pagination in the discover, lend, and borrow pages.



Bonus Requirements: Extra State Complexity

Different levels of authorization (example: users not yet logged in, logged in users, logged in administrators) are able to use different services or get different results from those services.
As we don't have passwords, this would be based on the user name and data saying which users have what permissions
Mention any predefined usernames and permissions in the README.

- My app has realized it since it gives different authorizations to normal users and admin users. Normal users are divided as not yet logged in and loggest in users. Admin user can see all data of the normal users.

- 1. not yet logged in users cannot view dashboard, lend, borrow and discover page.
- 2. logged users can access all pages and do the operation like add items on lend page, borrow items, reserve items
- 3. Admin user can see all data of the normal users.Admin username: admin; Admin email: admin@gmail.com. Admin can access the main data of all users. There are some already hard coded user data there.

Different "pages" and screens that are managed through state
Note: react-router is NOT allowed, forcing you to show your understanding of conditional rendering
The larger the number of visual states that are possible (and managed correctly), the more impressive the work

- "Go to Lend" button in My Lending area can lead to Lend page after clicking.
  "Go to Reserve" button in My Reserving area can lead to reserve page after clicking.
  "Go to Borrow" button in My borrowing area can lead to borrow page after clicking.
  "Go to Discover" button in Available to Borrow area can lead to discover page after clicking.
- On the above pages, the Back to Dashboard button can always lead to Dashboard.

Handling the "Back" button to provide "deeplinking" 
- When I first go to Home page and then go to about page. When I am on the about page, I can always go back to Home page by clicking the back button. 

Complex form validation with visual feedback to the user
"Complex" here means interactions like:
A field validation is based on multiple fields (example: a field is required only if a checkbox is checked")
Data has an unusual "shape" that is well validated (example: GPS coordinates). Note: Validating complex fields in ways that prevent valid answers (Names, phone numbers, email) won't count!

- I have made 10 forms in my app.

- log in form; sign up form; subscribe to news form; 
  add new item form;  modify add new item form; delete add new item form;
  modify reservation form;
  return item form;
  Borrow form; reserve form;
- In subscribe to news form, if the user check the offers, the comments area becomes required, or else the comments area can be optional; 
- In add new item form, the expected return date must be after lend date. If the user do it oppositely, the user will get error message and cannot add new item well; 
- In borrow item form, the due date must be after lend date. If the user do it oppositely, the user will get error message and cannot add new item well;
- But in return form, the user can choose a date that is earlier than borrowed date. 



All images below were downloaded free from unsplash.

License url: https://unsplash.com/license  

avatar image

download url: https://unsplash.com/photos/russian-blue-cat-wearing-yellow-sunglasses-yMSecCHsIBc 

logo image 

elaine-casap-qgHGDbbSNm8-unsplash.jpg
download url: https://unsplash.com/photos/bowl-of-tomatoes-served-on-person-hand-qgHGDbbSNm8

other images

madalyn-cox-aJkFP5Q1eus-unsplash.jpg
download url: https://unsplash.com/photos/black-and-yellow-labeled-box-aJkFP5Q1eus 

recha-oktaviani-t__61ap00Mc-unsplash.jpg 
download url: https://unsplash.com/photos/silver-steel-tool-on-white-surface-t__61ap00Mc 

dave-photoz-FdTmaUlEr4A-unsplash.jpg
download url: https://unsplash.com/photos/blue-yellow-and-green-plastic-blocks-FdTmaUlEr4A 

daria-nepriakhina-xY55bL5mZAM-unsplash.jpg
download url: https://unsplash.com/photos/pile-of-assorted-title-books-xY55bL5mZAM 

sincerely-media-CXYPfveiuis-unsplash.jpg
download url: https://unsplash.com/photos/milk-and-honey-by-rupi-kaur-book-on-side-table-CXYPfveiuis

devvrat-jadon-WLNkAHCjYOw-unsplash.jpg
download url: https://unsplash.com/photos/black-and-silver-claw-hammer-WLNkAHCjYOw

benjamin-lehman-EJU7A__krX0-unsplash.jpg
download url: https://unsplash.com/photos/a-couple-of-tools-that-are-sitting-on-a-table-EJU7A__krX0

studio-media-9DaOYUYnOls-unsplash.jpg
download url: https://unsplash.com/photos/open-book-on-top-of-several-stacked-books-9DaOYUYnOls

katherine-chase-VNBUJ6imfGs-unsplash.jpg 
download url: https://unsplash.com/photos/gra-yand-black-rice-cooker-VNBUJ6imfGs 

prophsee-journals-sFTMwH2Tvec-unsplash.jpg
download url: https://unsplash.com/photos/life-is-your-creation-card-sFTMwH2Tvec

sticker-mule-xdDfrh1sAp0-unsplash.jpg
download url: https://unsplash.com/photos/generocity-sticker-xdDfrh1sAp0 

simon-maage-KTzZVDjUsXw-unsplash.jpg
download url: https://unsplash.com/photos/person-holding-rectangular-black-wooden-photo-frame-with-give-thanks-print-KTzZVDjUsXw

lesly-juarez-DFtjXYd5Pto-unsplash.jpg
download url: https://unsplash.com/photos/mindfulness-printed-paper-near-window-DFtjXYd5Pto

alex-shute-bGOemOApXo4-unsplash.jpg
download url: https://unsplash.com/photos/a-wooden-block-that-says-trust-surrounded-by-blue-flowers-bGOemOApXo4
# Step 1: Bubble.io Database Schema & Data Import Guide

This guide walks you through setting up your database in **Bubble.io** using the pre-formatted CSV files generated from `bookleaf_sample_data.json`.

---

## 1. Generated Data Files

The files are located in `assignment2/data/`:

| File | Records | Purpose in Bubble |
| :--- | :--- | :--- |
| `authors.csv` | 10 authors | Upload to `Author` custom data type |
| `books.csv` | 18 books | Upload to `Book` custom data type |
| `users.csv` | 11 accounts (10 authors + 1 admin) | Upload to `User` built-in data type |
| `author_payloads.json` | 10 nested objects | Use for testing n8n webhooks and API Connector |

---

## 2. Bubble Database Schema Design

Log into your Bubble app, go to **Data** -> **Data types**, and create the following data types and fields:

### Data Type 1: `Author`
* `author_id` (Type: text) — e.g. "AUTH001"
* `name` (Type: text)
* `email` (Type: text)
* `phone` (Type: text)
* `city` (Type: text)
* `joined_date` (Type: date)
* `total_books` (Type: number)
* `total_copies_sold` (Type: number)
* `total_royalty_earned` (Type: number)
* `total_royalty_paid` (Type: number)
* `total_royalty_pending` (Type: number)
* `payout_status` (Type: text) — "Fully Paid", "Pending", "Overdue"
* `has_pending_royalty` (Type: text) — "yes" or "no"

### Data Type 2: `Book`
* `book_id` (Type: text) — e.g. "BK001"
* `author_id` (Type: text) — matches `Author.author_id`
* `author_name` (Type: text)
* `author_email` (Type: text)
* `title` (Type: text)
* `isbn` (Type: text)
* `genre` (Type: text)
* `publication_date` (Type: date)
* `status` (Type: text) — "Published & Live", "In Production - Cover Design", etc.
* `mrp` (Type: number)
* `author_royalty_per_copy` (Type: number)
* `total_copies_sold` (Type: number)
* `total_royalty_earned` (Type: number)
* `royalty_paid` (Type: number)
* `royalty_pending` (Type: number)
* `last_royalty_payout_date` (Type: date)
* `print_partner` (Type: text)
* `available_on` (Type: text)
* `royalty_status_badge` (Type: text) — "Green", "Yellow", "Red"

### Data Type 3: `User` (Built-in)
Add custom fields to the existing `User` type:
* `name` (Type: text)
* `role` (Type: text) — "Admin" or "Author"
* `author_id` (Type: text)
* `city` (Type: text)
* `phone` (Type: text)

### Data Type 4: `NotificationLog`
Create this table for tracking n8n royalty summary triggers:
* `author_id` (Type: text)
* `author_name` (Type: text)
* `author_email` (Type: text)
* `status` (Type: text) — "Pending", "Success", "Failed"
* `triggered_at` (Type: date)
* `completed_at` (Type: date)
* `email_subject` (Type: text)
* `email_summary` (Type: text)
* `error_message` (Type: text)

---

## 3. How to Upload CSVs into Bubble (3 Steps)

1. Open your Bubble app dashboard: **Data** -> **App data**
2. In the left panel, select the data type (e.g. `Author` or `Book`)
3. Click the **Upload** button in the top right:
   - Choose the corresponding CSV file (`assignment2/data/authors.csv`, `books.csv`, `users.csv`)
   - Bubble will automatically map column names to field names.
   - Click **Validate data** -> **Upload data**.

---

## 4. Privacy Rules Setup (`Data` -> `Privacy`)

### For `Book`:
* **Rule 1: "Admin Access"**
  - Condition: `Current User's role is "Admin"`
  - Permissions: Check all (View all fields, Find this in searches, View attached files)
* **Rule 2: "Author Access"**
  - Condition: `Current User's role is "Author" and Current User's author_id is This Book's author_id`
  - Permissions: Check all
* **Rule 3: Everyone Else (Default)**
  - Uncheck everything (No unauthorized access)

### For `Author`:
* **Rule 1: "Admin Access"**
  - Condition: `Current User's role is "Admin"`
  - Permissions: Check all
* **Rule 2: "Author Access"**
  - Condition: `Current User's role is "Author" and Current User's author_id is This Author's author_id`
  - Permissions: Check all
* **Rule 3: Everyone Else (Default)**
  - Uncheck everything

### For `NotificationLog`:
* **Rule 1: "Admin Access"**
  - Condition: `Current User's role is "Admin"`
  - Permissions: Check all


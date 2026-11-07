const fs = require('fs');
const path = require('path');

// Read raw sample data
const rawDataPath = path.join(__dirname, '../../bookleaf_sample_data.json');
const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

// Helper to escape CSV values
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Reference anchor date based on dataset's latest payout date (December 1, 2025)
const REFERENCE_DATE = new Date('2025-12-01');

function getDaysDiff(d1, d2) {
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateBookStatus(book) {
  if (book.status && book.status.startsWith('In Production')) {
    return 'Green';
  }
  if (!book.royalty_pending || book.royalty_pending === 0) {
    return 'Green';
  }

  // Pending > 0
  if (book.last_royalty_payout_date) {
    const payoutDate = new Date(book.last_royalty_payout_date);
    const daysSincePayout = getDaysDiff(payoutDate, REFERENCE_DATE);
    // If last payout was > 90 days ago, it's overdue
    if (daysSincePayout > 90) {
      return 'Red';
    }
    return 'Yellow';
  } else {
    // Never paid
    if (book.publication_date) {
      const pubDate = new Date(book.publication_date);
      const daysSincePub = getDaysDiff(pubDate, REFERENCE_DATE);
      // Below threshold (₹1000) rolls over, not necessarily overdue
      if (book.royalty_pending < 1000) {
        return 'Yellow';
      }
      if (daysSincePub > 90) {
        return 'Red';
      }
    }
    return 'Yellow';
  }
}

const authorsList = [];
const booksList = [];
const usersList = [];
const fullPayloads = [];

// Admin user for users.csv
usersList.push({
  email: 'admin@bookleafpub.in',
  name: 'BookLeaf Admin Operations',
  role: 'Admin',
  author_id: 'ADMIN001',
  city: 'Delhi',
  phone: '+91-11-2345-6789'
});

rawData.authors.forEach(author => {
  let totalCopiesSold = 0;
  let totalEarned = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let hasOverdueBook = false;

  author.books.forEach(b => {
    totalCopiesSold += (b.total_copies_sold || 0);
    totalEarned += (b.total_royalty_earned || 0);
    totalPaid += (b.royalty_paid || 0);
    totalPending += (b.royalty_pending || 0);

    const badge = calculateBookStatus(b);
    if (badge === 'Red') hasOverdueBook = true;

    booksList.push({
      book_id: b.book_id,
      author_id: author.author_id,
      author_name: author.name,
      author_email: author.email,
      title: b.title,
      isbn: b.isbn,
      genre: b.genre,
      publication_date: b.publication_date || '',
      status: b.status,
      mrp: b.mrp !== null ? b.mrp : '',
      author_royalty_per_copy: b.author_royalty_per_copy !== null ? b.author_royalty_per_copy : '',
      total_copies_sold: b.total_copies_sold || 0,
      total_royalty_earned: b.total_royalty_earned || 0,
      royalty_paid: b.royalty_paid || 0,
      royalty_pending: b.royalty_pending || 0,
      last_royalty_payout_date: b.last_royalty_payout_date || '',
      print_partner: b.print_partner || 'N/A',
      available_on: Array.isArray(b.available_on) ? b.available_on.join(', ') : '',
      royalty_status_badge: badge
    });
  });

  let payoutStatus = 'Fully Paid';
  if (hasOverdueBook) {
    payoutStatus = 'Overdue';
  } else if (totalPending > 0) {
    payoutStatus = 'Pending';
  }

  authorsList.push({
    author_id: author.author_id,
    name: author.name,
    email: author.email,
    phone: author.phone,
    city: author.city,
    joined_date: author.joined_date,
    total_books: author.books.length,
    total_copies_sold: totalCopiesSold,
    total_royalty_earned: totalEarned,
    total_royalty_paid: totalPaid,
    total_royalty_pending: totalPending,
    payout_status: payoutStatus,
    has_pending_royalty: totalPending > 0 ? 'yes' : 'no'
  });

  usersList.push({
    email: author.email,
    name: author.name,
    role: 'Author',
    author_id: author.author_id,
    city: author.city,
    phone: author.phone
  });

  fullPayloads.push({
    author_id: author.author_id,
    name: author.name,
    email: author.email,
    phone: author.phone,
    city: author.city,
    joined_date: author.joined_date,
    summary: {
      total_books: author.books.length,
      total_copies_sold: totalCopiesSold,
      total_royalty_earned: totalEarned,
      total_royalty_paid: totalPaid,
      total_royalty_pending: totalPending,
      payout_status: payoutStatus
    },
    books: author.books.map(b => ({
      book_id: b.book_id,
      title: b.title,
      isbn: b.isbn,
      genre: b.genre,
      publication_date: b.publication_date,
      status: b.status,
      mrp: b.mrp,
      author_royalty_per_copy: b.author_royalty_per_copy,
      total_copies_sold: b.total_copies_sold,
      total_royalty_earned: b.total_royalty_earned,
      royalty_paid: b.royalty_paid,
      royalty_pending: b.royalty_pending,
      last_royalty_payout_date: b.last_royalty_payout_date,
      print_partner: b.print_partner,
      available_on: b.available_on,
      badge: calculateBookStatus(b)
    }))
  });
});

// Write authors.csv
const authorHeaders = Object.keys(authorsList[0]);
const authorRows = [
  authorHeaders.join(','),
  ...authorsList.map(a => authorHeaders.map(h => csvEscape(a[h])).join(','))
].join('\n');
fs.writeFileSync(path.join(__dirname, '../data/authors.csv'), authorRows, 'utf8');

// Write books.csv
const bookHeaders = Object.keys(booksList[0]);
const bookRows = [
  bookHeaders.join(','),
  ...booksList.map(b => bookHeaders.map(h => csvEscape(b[h])).join(','))
].join('\n');
fs.writeFileSync(path.join(__dirname, '../data/books.csv'), bookRows, 'utf8');

// Write users.csv
const userHeaders = Object.keys(usersList[0]);
const userRows = [
  userHeaders.join(','),
  ...usersList.map(u => userHeaders.map(h => csvEscape(u[h])).join(','))
].join('\n');
fs.writeFileSync(path.join(__dirname, '../data/users.csv'), userRows, 'utf8');

// Write full JSON payloads for n8n webhook testing
fs.writeFileSync(
  path.join(__dirname, '../data/author_payloads.json'),
  JSON.stringify({ authors: fullPayloads }, null, 2),
  'utf8'
);

console.log(' Successfully generated:');
console.log(' - assignment2/data/authors.csv (' + authorsList.length + ' authors)');
console.log(' - assignment2/data/books.csv (' + booksList.length + ' books)');
console.log(' - assignment2/data/users.csv (' + usersList.length + ' users: 10 authors + 1 admin)');
console.log(' - assignment2/data/author_payloads.json (Rich nested payloads for n8n testing)');


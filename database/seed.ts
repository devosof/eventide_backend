import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/entities/user.entity';
import { OrganizerProfile } from '../src/entities/organizer-profile.entity';
import { Category } from '../src/entities/category.entity';
import { Event } from '../src/entities/event.entity';
import { EventLocation } from '../src/entities/event-location.entity';
import { EventImage } from '../src/entities/event-image.entity';
import { Ticket } from '../src/entities/ticket.entity';
import { Booking } from '../src/entities/booking.entity';
import { Review } from '../src/entities/review.entity';

async function seed() {
  // Initialize DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    url: 'postgresql://neondb_owner:npg_ez7Y4xFSvZgR@ep-flat-shape-ah5yib9s-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    entities: [
      User,
      OrganizerProfile,
      Category,
      Event,
      EventLocation,
      EventImage,
      Ticket,
      Booking,
      Review,
    ],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✅ Database connected');

  // Clear existing data
  await dataSource.query('TRUNCATE TABLE "review" CASCADE');
  await dataSource.query('TRUNCATE TABLE "booking" CASCADE');
  await dataSource.query('TRUNCATE TABLE "ticket" CASCADE');
  await dataSource.query('TRUNCATE TABLE "event_image" CASCADE');
  await dataSource.query('TRUNCATE TABLE "event_categories_category" CASCADE');
  await dataSource.query('TRUNCATE TABLE "event" CASCADE');
  await dataSource.query('TRUNCATE TABLE "event_location" CASCADE');
  await dataSource.query('TRUNCATE TABLE "category" CASCADE');
  await dataSource.query('TRUNCATE TABLE "organizer_profile" CASCADE');
  await dataSource.query('TRUNCATE TABLE "user" CASCADE');
  console.log('✅ Database cleared');

  const userRepo = dataSource.getRepository(User);
  const orgProfileRepo = dataSource.getRepository(OrganizerProfile);
  const categoryRepo = dataSource.getRepository(Category);
  const eventRepo = dataSource.getRepository(Event);
  const locationRepo = dataSource.getRepository(EventLocation);
  const imageRepo = dataSource.getRepository(EventImage);
  const ticketRepo = dataSource.getRepository(Ticket);
  const bookingRepo = dataSource.getRepository(Booking);
  const reviewRepo = dataSource.getRepository(Review);

  // 1. Create Users
  console.log('\n📝 Creating users...');
  const password = await bcrypt.hash('password123', 10);

  const attendee1 = await userRepo.save({
    name: 'John Doe',
    email: 'john@example.com',
    password,
    role: UserRole.ATTENDEE,
  });

  const attendee2 = await userRepo.save({
    name: 'Jane Smith',
    email: 'jane@example.com',
    password,
    role: UserRole.ATTENDEE,
  });

  const attendee3 = await userRepo.save({
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password,
    role: UserRole.ATTENDEE,
  });

  const organizer1 = await userRepo.save({
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    password,
    role: UserRole.ORGANIZER,
  });

  const organizer2 = await userRepo.save({
    name: 'David Brown',
    email: 'david@example.com',
    password,
    role: UserRole.ORGANIZER,
  });

  console.log(`✅ Created ${5} users`);

  // 2. Create Organizer Profiles
  console.log('\n📝 Creating organizer profiles...');
  
  const orgProfile1 = await orgProfileRepo.save({
    user: organizer1,
    organizationName: 'EventMasters Inc',
    address: '123 Event Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001',
  });

  const orgProfile2 = await orgProfileRepo.save({
    user: organizer2,
    organizationName: 'Concert Productions LLC',
    address: '456 Music Avenue',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    zipCode: '90001',
  });

  console.log(`✅ Created ${2} organizer profiles`);

  // 3. Create Categories
  console.log('\n📝 Creating categories...');
  
  const music = await categoryRepo.save({ name: 'Music' });
  const sports = await categoryRepo.save({ name: 'Sports' });
  const technology = await categoryRepo.save({ name: 'Technology' });
  const food = await categoryRepo.save({ name: 'Food & Drink' });
  const arts = await categoryRepo.save({ name: 'Arts & Culture' });
  const business = await categoryRepo.save({ name: 'Business' });

  console.log(`✅ Created ${6} categories`);

  // 4. Create Events with Locations, Images, and Tickets
  console.log('\n📝 Creating events...');

  // Event 1: Music Festival (Future event)
  const location1 = await locationRepo.save({
    address: '789 Festival Ground',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10002',
    googleMapsLink: 'https://maps.google.com/?q=789+Festival+Ground+New+York',
  });

  const event1 = await eventRepo.save({
    name: 'Summer Music Festival 2025',
    description: 'The biggest music festival of the year featuring top artists from around the world. Three days of non-stop music, food, and entertainment.',
    startDate: new Date('2025-07-15T12:00:00'),
    endDate: new Date('2025-07-17T23:00:00'),
    capacity: 5000,
    organizer: organizer1,
    location: location1,
    categories: [music, food],
  });

  await imageRepo.save([
    { imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea', event: event1 },
    { imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819', event: event1 },
  ]);

  await ticketRepo.save([
    {
      name: 'Early Bird',
      price: 99.99,
      salesStartDate: new Date('2025-01-01'),
      salesEndDate: new Date('2025-06-01'),
      event: event1,
    },
    {
      name: 'General Admission',
      price: 149.99,
      salesStartDate: new Date('2025-06-02'),
      salesEndDate: new Date('2025-07-14'),
      event: event1,
    },
    {
      name: 'VIP Pass',
      price: 299.99,
      salesStartDate: new Date('2025-01-01'),
      salesEndDate: new Date('2025-07-14'),
      event: event1,
    },
  ]);

  // Event 2: Tech Conference (Future event)
  const location2 = await locationRepo.save({
    address: '100 Innovation Drive',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    postalCode: '94105',
    googleMapsLink: 'https://maps.google.com/?q=100+Innovation+Drive+San+Francisco',
  });

  const event2 = await eventRepo.save({
    name: 'TechSummit 2025',
    description: 'Join industry leaders and innovators for a day of insights into the future of technology. Keynotes, workshops, and networking opportunities.',
    startDate: new Date('2025-08-20T09:00:00'),
    endDate: new Date('2025-08-20T18:00:00'),
    capacity: 500,
    organizer: organizer2,
    location: location2,
    categories: [technology, business],
  });

  await imageRepo.save([
    { imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87', event: event2 },
  ]);

  await ticketRepo.save([
    {
      name: 'Standard Pass',
      price: 199.00,
      salesStartDate: new Date('2025-02-01'),
      salesEndDate: new Date('2025-08-19'),
      event: event2,
    },
    {
      name: 'Premium Pass',
      price: 399.00,
      salesStartDate: new Date('2025-02-01'),
      salesEndDate: new Date('2025-08-19'),
      event: event2,
    },
  ]);

  // Event 3: Food Festival (Future event)
  const location3 = await locationRepo.save({
    address: '250 Culinary Lane',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    postalCode: '60601',
    googleMapsLink: 'https://maps.google.com/?q=250+Culinary+Lane+Chicago',
  });

  const event3 = await eventRepo.save({
    name: 'International Food Festival',
    description: 'Taste dishes from over 50 countries. Meet renowned chefs, attend cooking demonstrations, and enjoy live entertainment.',
    startDate: new Date('2025-09-10T11:00:00'),
    endDate: new Date('2025-09-12T22:00:00'),
    capacity: 3000,
    organizer: organizer1,
    location: location3,
    categories: [food, arts],
  });

  await imageRepo.save([
    { imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', event: event3 },
  ]);

  await ticketRepo.save([
    {
      name: 'Day Pass',
      price: 45.00,
      salesStartDate: new Date('2025-05-01'),
      salesEndDate: new Date('2025-09-09'),
      event: event3,
    },
    {
      name: '3-Day Pass',
      price: 120.00,
      salesStartDate: new Date('2025-05-01'),
      salesEndDate: new Date('2025-09-09'),
      event: event3,
    },
  ]);

  // Event 4: Marathon (Past event for reviews)
  const location4 = await locationRepo.save({
    address: 'Central Park',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10024',
    googleMapsLink: 'https://maps.google.com/?q=Central+Park+New+York',
  });

  const event4 = await eventRepo.save({
    name: 'NYC Marathon 2024',
    description: 'Annual marathon through the streets of New York City. A challenging course with amazing crowd support.',
    startDate: new Date('2024-11-03T08:00:00'),
    endDate: new Date('2024-11-03T16:00:00'),
    capacity: 10000,
    organizer: organizer2,
    location: location4,
    categories: [sports],
  });

  await imageRepo.save([
    { imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3', event: event4 },
  ]);

  const marathonTickets = await ticketRepo.save([
    {
      name: 'Runner Registration',
      price: 150.00,
      salesStartDate: new Date('2024-06-01'),
      salesEndDate: new Date('2024-10-31'),
      event: event4,
    },
  ]);

  // Event 5: Art Exhibition (Past event for reviews)
  const location5 = await locationRepo.save({
    address: '88 Art Gallery Street',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    postalCode: '90012',
    googleMapsLink: 'https://maps.google.com/?q=88+Art+Gallery+Street+LA',
  });

  const event5 = await eventRepo.save({
    name: 'Modern Art Exhibition',
    description: 'Featuring contemporary works from emerging and established artists. A journey through modern artistic expression.',
    startDate: new Date('2024-10-15T10:00:00'),
    endDate: new Date('2024-10-20T20:00:00'),
    capacity: 200,
    organizer: organizer1,
    location: location5,
    categories: [arts],
  });

  await imageRepo.save([
    { imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b', event: event5 },
  ]);

  const artTickets = await ticketRepo.save([
    {
      name: 'General Admission',
      price: 25.00,
      salesStartDate: new Date('2024-09-01'),
      salesEndDate: new Date('2024-10-19'),
      event: event5,
    },
  ]);

  console.log(`✅ Created ${5} events with locations, images, and tickets`);

  // 5. Create Bookings
  console.log('\n📝 Creating bookings...');

   const event1Tickets = await ticketRepo.find({ where: { event: { id: event1.id } } });
  const event2Tickets = await ticketRepo.find({ where: { event: { id: event2.id } } });
  const event3Tickets = await ticketRepo.find({ where: { event: { id: event3.id } } });

  // Future event bookings
  await bookingRepo.save([
    {
      user: attendee1,
      event: event1,
      ticket: event1Tickets[0],
      status: 'CONFIRMED',
    },
    {
      user: attendee2,
      event: event1,
      ticket: event1Tickets[1],
      status: 'CONFIRMED',
    },
    {
      user: attendee3,
      event: event2,
      ticket: event2Tickets[0],
      status: 'CONFIRMED',
    },
    {
      user: attendee1,
      event: event3,
      ticket: event3Tickets[1],
      status: 'CONFIRMED',
    },
  ]);

  // Past event bookings (for reviews)
  

  await bookingRepo.save([
    {
      user: attendee1,
      event: event4,
      ticket: marathonTickets[0],
      status: 'CONFIRMED',
      bookingDate: new Date('2024-09-15'),
    },
    {
      user: attendee2,
      event: event4,
      ticket: marathonTickets[0],
      status: 'CONFIRMED',
      bookingDate: new Date('2024-09-20'),
    },
    {
      user: attendee3,
      event: event5,
      ticket: artTickets[0],
      status: 'CONFIRMED',
      bookingDate: new Date('2024-10-01'),
    },
    {
      user: attendee1,
      event: event5,
      ticket: artTickets[0],
      status: 'CANCELLED',
      bookingDate: new Date('2024-10-02'),
    },
  ]);

  console.log(`✅ Created ${8} bookings`);

  // 6. Create Reviews (only for past events with confirmed bookings)
  console.log('\n📝 Creating reviews...');

  await reviewRepo.save([
    {
      user: attendee1,
      event: event4,
      rating: 5,
      comment: 'Amazing experience! The organization was perfect and the crowd support was incredible. Will definitely participate again next year!',
    },
    {
      user: attendee2,
      event: event4,
      rating: 4,
      comment: 'Great event overall. The route was challenging but rewarding. Water stations were well-placed.',
    },
    {
      user: attendee3,
      event: event5,
      rating: 5,
      comment: 'Stunning art collection! The curation was excellent and the venue was perfect for showcasing the works.',
    },
  ]);

  console.log(`✅ Created ${3} reviews`);

  await dataSource.destroy();
  console.log('\n✅ Seeding completed successfully!\n');
}

// Run the seed function
seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
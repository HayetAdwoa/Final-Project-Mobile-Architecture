const amqp = require('amqplib');
require('dotenv').config();

let channel = null;
let connection = null;

async function connectRabbitMQ() {
  if (channel) return channel;

  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange('emergency.platform.events', 'topic', { durable: true });

  connection.on('error', (err) => {
    console.error('RabbitMQ connection error:', err.message);
    channel = null;
    connection = null;
    setTimeout(connectRabbitMQ, 3000);
  });
  connection.on('close', () => {
    console.warn('RabbitMQ connection closed, reconnecting...');
    channel = null;
    connection = null;
    setTimeout(connectRabbitMQ, 3000);
  });

  console.log('Connected to RabbitMQ');
  return channel;
}

module.exports = { connectRabbitMQ };

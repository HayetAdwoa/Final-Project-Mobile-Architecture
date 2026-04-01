const amqp = require('amqplib');
require('dotenv').config();

let channel = null;
let connection = null;
let rabbitEnabled = true;

async function connectRabbitMQ() {
  if (channel) return channel;

  let rabbitUrl = process.env.RABBITMQ_URL?.trim();
  if (!rabbitUrl) {
    rabbitEnabled = false;
    console.warn('RabbitMQ disabled: RABBITMQ_URL is not set. Events will not be consumed.');
    return null;
  }
  if (rabbitUrl.startsWith('RABBITMQ_URL=')) {
    rabbitUrl = rabbitUrl.slice('RABBITMQ_URL='.length).trim();
  }
  if (!/^amqps?:\/\//.test(rabbitUrl)) {
    throw new Error(`Invalid RABBITMQ_URL protocol: ${rabbitUrl}. Expected amqp:// or amqps://`);
  }

  connection = await amqp.connect(rabbitUrl);
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

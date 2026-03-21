const amqp = require('amqplib');
require('dotenv').config();

let channel = null;

async function connectRabbitMQ() {
  if (channel) return channel;
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertExchange('emergency.platform.events', 'topic', { durable: true });
  return channel;
}

module.exports = { connectRabbitMQ };
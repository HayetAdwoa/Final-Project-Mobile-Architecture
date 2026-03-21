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

async function publishEvent(routingKey, payload) {
  const ch = await connectRabbitMQ();
  const msg = Buffer.from(JSON.stringify(payload));
  ch.publish('emergency.platform.events', routingKey, msg, { persistent: true });
  console.log(`Published event: ${routingKey}`);
}

module.exports = { connectRabbitMQ, publishEvent };
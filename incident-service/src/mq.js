const amqp = require('amqplib');
require('dotenv').config();

let channel = null;
let connection = null;

async function connectRabbitMQ() {
  if (channel) return channel;
  
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange('emergency.platform.events', 'topic', { durable: true });

  // Reconnect on error or close
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

async function publishEvent(routingKey, payload) {
  try {
    const ch = await connectRabbitMQ();
    const msg = Buffer.from(JSON.stringify(payload));
    ch.publish('emergency.platform.events', routingKey, msg, { persistent: true });
    console.log(`Published event: ${routingKey}`);
  } catch (err) {
    console.error('Failed to publish event:', err.message);
    channel = null;
    connection = null;
  }
}

module.exports = { connectRabbitMQ, publishEvent };

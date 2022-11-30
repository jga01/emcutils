const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Replies with your input!')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('The input to echo back')
				.setRequired(true))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to echo into'))
		.addBooleanOption(option =>
			option.setName('ephemeral')
				.setDescription('Whether or not the echo should be ephemeral')),
	async execute(interaction) {
		const input = interaction.options.getString('input');
		const channel = interaction.options.getChannel('channel');
		const isEphemeral = interaction.option.getString('ephemeral');
		console.log(`Echoed ${input} in channel ${channel} and it's ${isEphemeral} that the message was ephemeral.`);
	},
};
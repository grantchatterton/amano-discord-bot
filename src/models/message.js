export default (sequelize, DataTypes) => {
	return sequelize.define("Message", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		mimic: {
			type: DataTypes.TEXT,
		},
	});
};

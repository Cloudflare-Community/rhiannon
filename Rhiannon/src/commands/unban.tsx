import {
  CommandHandler,
  useDescription,
  useString,
  createElement,
  Message,
  Embed,
  Field
} from "slshx";
import type {APIBan,Snowflake} from "discord-api-types";
import {isModerator, createLog} from "../utils";

export default function unban(): CommandHandler<Env> {
  useDescription("unbans a user");
  const user = useString("user", "user to unban", { required: true }) as Snowflake;
  const reason = useString("reason", "reason for unban", { required: true });
  return async (interaction, env) => {
    if(!interaction.guild_id) return <Message ephemeral>❌Error: Guild was not detected.❌</Message>;
    if(!interaction.member) return <Message ephemeral>❌Error: You must be a member of this guild to use this command.❌</Message>;
    if(!(await isModerator(interaction, env))) return <Message ephemeral>❌Error: You must be a moderator to use this command.❌</Message>;
    const ban = await getBan(user, interaction.guild_id, env);
    if(!ban) return <Message ephemeral>❌Error: User is not banned.❌</Message>;
    await removeBan(user, interaction.guild_id, reason, env);
    const msg = <Message ephemeral>
      <Embed
        title={"Unbanned User"}
        timestamp={new Date()}
        color={5763719}
        thumbnail={`https://cdn.discordapp.com/avatars/${ban.user.id}/${ban.user.avatar}.webp`}
        footer={{text:"Command Executed by Rhiannon", iconUrl:`https://cdn.discordapp.com/avatars/922374334159409173/00da613d16217aa6b2ff31e01ba25c1c.webp`}}
      >
        <Field name="Target:">{`<@${ban.user.id}>`}</Field>
        <Field name="Reason:">{reason}</Field>
        <Field name="Invoked By:">{`<@${interaction.member.user.id}>`}</Field>
      </Embed>
    </Message>;
    const res = await createLog(interaction.guild_id, msg, env);
    switch(res) {
      case "Missing Channel":
        msg.content = "⚠️Warning: This server does not currently have a moderation log channel. Any actions taken without one configured will not be logged.⚠️";
        return msg;
      case "Error while sending log":
        msg.content = "❌Error: An error occurred while attempting to send the log.❌";
      case "OK":
        return msg;
    }
  };
}

async function getBan(user: Snowflake, guild: Snowflake, env: Env) : Promise<APIBan | null> {
  const res : any = await (await fetch(`https://discord.com/api/v9/guilds/${guild}/bans/${user}`, {method:"GET",headers:{Authorization: env.TOKEN}})).json();
  if(res.code === 10026) return null;
  return res;
}

function removeBan(user: Snowflake, guild: Snowflake, reason: string, env: Env) : Promise<Response> {
  return fetch(`https://discord.com/api/v9/guilds/${guild}/bans/${user}`, {method:"DELETE",headers:{Authorization: env.TOKEN,"X-Audit-Log-Reason":reason}});
}
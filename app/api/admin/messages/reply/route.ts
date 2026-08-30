import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request){

try{

const {email, reply} = await req.json();

if(!email || !reply){
return NextResponse.json(
{error:"Missing fields"},
{status:400}
);
}


const result = await resend.emails.send({

from: process.env.RESEND_FROM_EMAIL!,

to: email,

replyTo: email,

subject:"Reply from GAMORA ONLINE",

html:`
<div style="font-family:Arial">

<h2>GAMORA ONLINE</h2>

<p>${reply}</p>

<br/>

<hr/>

<p style="color:#777;font-size:12px">
Reply from GAMORA ONLINE Customer Support
</p>

</div>
`

});


console.log("RESEND RESULT:", result);


return NextResponse.json({
success:true,
result
});


}catch(error:any){

console.error("RESEND ERROR:", error);

return NextResponse.json(
{
error:error.message || "Server error"
},
{status:500}
);

}

}

export default function RecoverPassword(){

return (
<main className="min-h-screen bg-slate-50 p-5">

<div className="mx-auto max-w-md rounded-xl border bg-white p-6">

<h1 className="text-lg font-medium">
Recover Password
</h1>

<p className="mt-2 text-sm text-slate-500">
Weka email yako ili kurejesha password.
</p>

<input
placeholder="Email"
className="mt-5 w-full rounded-lg border px-3 py-2 text-sm"
/>

<button className="mt-4 w-full rounded-lg bg-sky-700 py-2 text-sm text-white">
Send Reset Link
</button>

</div>

</main>
)

}

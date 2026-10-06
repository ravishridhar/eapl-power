// Run against a PHP preview with NO SMTP password configuration. Never sends email.
const assert = require('node:assert/strict');
(async () => {
  const base = process.env.EAPL_TEST_BASE || 'http://127.0.0.1:5501';
  const response = await fetch(base + '/api/captcha.php');
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const challenge = await response.json();
  assert.equal(challenge.token.length, 64);
  assert.equal(challenge.answer, undefined);
  const answer = String(challenge.question.match(/\d+/g).map(Number).reduce((a,b) => a+b));
  const fields = {name:'Test Visitor',email:'visitor@example.com',mobile:'9876543210',pin:'122001',product:'Home Inverter'};
  const send = async (body, session = cookie) => {
    const response = await fetch(base + '/api/enquiry.php', {method:'POST',headers:{'Content-Type':'application/json',Cookie:session},body:JSON.stringify(body)});
    return {status:response.status,...await response.json()};
  };
  const body = {form:'enquiryForm',fields,captcha:{token:challenge.token,answer}};
  assert.equal((await send({...body,captcha:{...body.captcha,answer:'99'}})).code,'captcha_incorrect');
  assert.equal((await send(body,'')).code,'captcha_expired');
  assert.equal((await send({...body,fields:{...fields,pin:'000000'}})).status,422);
  // A fake/absent configuration must fail closed and consume the token.
  const result = await send(body);
  assert.equal(result.status,503); assert.equal(result.code,'mail_unavailable');
  assert.equal((await send(body)).code,'captcha_expired');
  const badOrigin = await fetch(base+'/api/captcha.php',{headers:{Origin:'https://example.com'}});
  assert.equal(badOrigin.status,403);
  console.log('HTTP captcha sessions, wrong answers, server validation, cross-origin blocking, mail failure and replay checks passed.');
})().catch(error => {console.error(error);process.exitCode=1});

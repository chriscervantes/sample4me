# Improvements

**Author:** <Your name here>
**Role:** <The role title you have applied for>
**Time taken:** <Let us know how many hours and minutes you spent on this task, including writing your improvements>

There are quite a few improvements intentionally left out of the codebase for you to write about. This is your chance to show off your thinking and we would love to hear your thoughts around making this a production system. The improvements could be wide ranging touching on, for example, the code, monitoring and observability, cicd, infra, system design, security, and beyond.



- Always use an ENUM, this will prevent any typo errors 
- Add rateLimit mechanism which prevent from DDoS attack. 
- Under the error logging we should add whatever observability tool you have and log that error there. 
- Need to add generic exception handling which is reusable all across the code. In this way, we can standardize the error messages.
- Use object based parameters IF its more than 1 parameter. function x({id, name}:{id:number, name:string})
- what is the reason why we are using zod not joi or ajv for validation?